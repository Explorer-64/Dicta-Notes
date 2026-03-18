import logging
import re
from typing import List, Dict, Any, Optional

logger = logging.getLogger("dicta.speaker_identification")
from fastapi import APIRouter, HTTPException

# Create router
router = APIRouter()

# Define a Speaker type for cleaner type hints
Speaker = Dict[str, Any]
TranscriptionSegment = Dict[str, Any]

def process_transcription_result(result_json: Dict[str, Any]) -> Dict[str, Any]:
    """Process the transcription result from Gemini API"""
    try:
        # Ensure we have speakers and segments sections
        if not isinstance(result_json, dict):
            logger.warning("result_json is not a dictionary, received: %s", type(result_json))
            # Create a default structure
            result_json = {"speakers": [], "segments": []}
            
        if "speakers" not in result_json:
            logger.warning("'speakers' not found in result, adding default value")
            result_json["speakers"] = [{"id": "speaker_1", "name": "Unknown Speaker"}]
            
        if "segments" not in result_json:
            logger.warning("'segments' not found in result, adding empty list")
            result_json["segments"] = []
        
        # Process segments to ensure proper formatting
        segments = result_json.get("segments", [])
        for segment in segments:
            # Ensure segment has all required fields
            if "speaker" not in segment or "text" not in segment:
                continue
                
            # Make sure start_time and end_time are floats
            if "start_time" in segment:
                segment["start_time"] = float(segment["start_time"])
            else:
                segment["start_time"] = 0.0
                
            if "end_time" in segment:
                segment["end_time"] = float(segment["end_time"])
            else:
                # Estimate end time based on text length if not provided
                segment["end_time"] = segment.get("start_time", 0.0) + (len(segment["text"]) * 0.05)
                
            # Ensure speaker object is correctly structured
            if isinstance(segment["speaker"], dict):
                # Make sure we have name field
                if "name" not in segment["speaker"]:
                    # Try to find name in speakers list
                    speaker_id = segment["speaker"].get("id")
                    speaker_name = next((s.get("name", "Unknown Speaker") 
                                        for s in result_json.get("speakers", []) if s.get("id") == speaker_id), "Unknown Speaker")
                    segment["speaker"]["name"] = speaker_name
            elif isinstance(segment["speaker"], str):
                # Convert speaker ID string to speaker object
                speaker_id = segment["speaker"]
                # Find speaker name from speakers list
                speaker_name = next((s.get("name", "Unknown Speaker") 
                                    for s in result_json.get("speakers", []) if s.get("id") == speaker_id), "Unknown Speaker")
                segment["speaker"] = {"id": speaker_id, "name": speaker_name}
            else:
                # Fallback to unknown speaker
                segment["speaker"] = {"id": "unknown", "name": "Unknown Speaker"}
        
        # Ensure proper typing for the processed result
        processed_result = {
            "speakers": result_json.get("speakers", []),
            "segments": segments,
            "meeting_title": result_json.get("meeting_title", "Untitled Meeting"),
            "duration": float(result_json.get("duration", 0.0))
        }
        
        return processed_result
    except Exception as e:
        logger.error("Error processing transcription result: %s", e)
        raise ValueError(f"Failed to process transcription result: {e}") from e

def extract_speakers_from_transcript(transcript: str) -> List[Speaker]:
    """Extract speaker information from a transcript"""
    # This regex looks for speaker patterns like "Speaker 1:", "John:" at the start of lines
    speaker_pattern = re.compile(r'^([^:\n]+):', re.MULTILINE)
    
    # Find all unique speaker names
    speaker_matches = speaker_pattern.findall(transcript)
    
    # Convert to unique list while preserving order
    unique_speakers = []
    for speaker in speaker_matches:
        speaker = speaker.strip()
        if speaker and speaker not in [s['name'] for s in unique_speakers]:
            unique_speakers.append({"id": f"speaker_{len(unique_speakers) + 1}", "name": speaker})
    
    # If no speakers found, add an unknown speaker
    if not unique_speakers:
        unique_speakers.append({"id": "speaker_1", "name": "Unknown Speaker"})
        
    return unique_speakers

def assign_speaker_colors(speakers: List[Speaker]) -> Dict[str, str]:
    """Assign consistent colors to speakers for UI display"""
    # Define a palette of colors
    colors = [
        "#4285F4",  # Google Blue
        "#EA4335",  # Google Red
        "#FBBC05",  # Google Yellow
        "#34A853",  # Google Green
        "#673AB7",  # Purple
        "#FF9800",  # Orange
        "#795548",  # Brown
        "#607D8B",  # Blue Grey
        "#009688",  # Teal
        "#E91E63",  # Pink
    ]
    
    # Assign colors to speakers
    speaker_colors = {}
    for i, speaker in enumerate(speakers):
        color_index = i % len(colors)  # Cycle through colors if more speakers than colors
        speaker_colors[speaker["id"]] = colors[color_index]
        
    return speaker_colors

def structure_transcript_by_speaker(transcript: str, speakers: List[Speaker]) -> List[TranscriptionSegment]:
    """Structure a transcript into segments by speaker"""
    segments = []
    
    # Build a regex pattern to match all speaker labels
    speaker_names = [re.escape(speaker["name"]) for speaker in speakers]
    speaker_pattern = re.compile(f'^({"|".join(speaker_names)}):\s*(.*?)(?=^(?:{"|".join(speaker_names)}):|$)', 
                                 re.MULTILINE | re.DOTALL)
    
    # Find all segments with their speakers
    for match in speaker_pattern.finditer(transcript):
        speaker_name = match.group(1).strip()
        text = match.group(2).strip()
        
        # Skip empty segments
        if not text:
            continue
            
        # Find speaker ID from name
        speaker_id = next((s["id"] for s in speakers if s["name"] == speaker_name), "unknown")
        
        # Extract timestamp if present (format: [00:00:00])
        timestamp_match = re.search(r'\[(\d{2}:\d{2}:\d{2})\]', text)
        start_time = 0.0
        
        if timestamp_match:
            # Convert timestamp to seconds
            timestamp = timestamp_match.group(1)
            h, m, s = map(int, timestamp.split(':'))
            start_time = h * 3600 + m * 60 + s
            
            # Remove timestamp from text
            text = re.sub(r'\[\d{2}:\d{2}:\d{2}\]\s*', '', text).strip()
            
        # Add segment
        segments.append({
            "speaker": speaker_id,
            "text": text,
            "start_time": start_time,
            "end_time": start_time + (len(text) * 0.05)  # Estimate end time based on text length
        })
    
    return segments

def match_speakers_to_names(speakers: List[Speaker], participant_names: List[str]) -> List[Speaker]:
    """Match detected speakers to provided participant names where possible"""
    if not participant_names:
        return speakers
        
    # Create a copy to avoid modifying the original
    updated_speakers = speakers.copy()
    
    # Check for direct name matches
    for i, speaker in enumerate(updated_speakers):
        speaker_name = speaker.get("name", "").lower()
        
        # Skip if already named precisely
        if any(name.lower() == speaker_name for name in participant_names):
            continue
            
        # Try to match pattern like "Speaker 1" to a real name
        if re.match(r'^speaker\s*\d+$', speaker_name, re.IGNORECASE):
            # Assign a participant name if available
            if i < len(participant_names):
                updated_speakers[i]["name"] = participant_names[i]
                
    return updated_speakers

def enhance_speaker_identification(segments: List[TranscriptionSegment], speakers: List[Speaker]) -> List[TranscriptionSegment]:
    """Enhance speaker identification and segment organization"""
    # Create a mapping of speaker IDs to names
    speaker_map = {s["id"]: s["name"] for s in speakers}
    
    # Sort segments by start time
    sorted_segments = sorted(segments, key=lambda x: x.get("start_time", 0))
    
    # Add speaker names to segments
    for segment in sorted_segments:
        speaker_id = segment.get("speaker")
        if speaker_id in speaker_map:
            segment["speaker_name"] = speaker_map[speaker_id]
    
    return sorted_segments
