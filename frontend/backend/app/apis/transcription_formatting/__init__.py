import logging
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException

logger = logging.getLogger("dicta.transcription_formatting")
import json
import re

# Create router
router = APIRouter()

from ..speaker_identification import extract_speakers_from_transcript, assign_speaker_colors, structure_transcript_by_speaker

def format_full_text(segments: List[Dict[str, Any]]) -> str:
    """Format segments into a readable transcript text"""
    formatted_text = ""
    
    for segment in segments:
        # Get speaker information
        speaker = segment.get("speaker", {})
        if isinstance(speaker, dict):
            speaker_name = speaker.get("name", "Unknown Speaker")
        elif isinstance(speaker, str):
            speaker_name = speaker
        else:
            speaker_name = "Unknown Speaker"
            
        # Format timestamp
        start_time = segment.get("start_time", 0.0)
        minutes = int(start_time // 60)
        seconds = int(start_time % 60)
        timestamp = f"[{minutes:02d}:{seconds:02d}] "
        
        # Add this segment to the full text
        formatted_text += f"{timestamp}{speaker_name}: {segment.get('text', '')}\n\n"
    
    return formatted_text

# Helper functions for formatting transcription results
def format_transcription_result(transcription: str, session_id: str = None, speaker_names: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """Format the raw transcription into a structured response"""
    try:
        # Extract speakers from transcription
        speakers = extract_speakers_from_transcript(transcription)
        
        # Assign colors to speakers
        speaker_colors = assign_speaker_colors(speakers)
        
        # Apply custom speaker names if provided
        if speaker_names:
            for speaker in speakers:
                if speaker["id"] in speaker_names:
                    speaker["name"] = speaker_names[speaker["id"]]
        
        # Structure transcript by speaker turns
        segments = structure_transcript_by_speaker(transcription, speakers)
        
        # Create response
        response = {
            "id": session_id,
            "full_text": transcription,
            "speakers": speakers,
            "speaker_colors": speaker_colors,
            "segments": segments
        }
        
        return response
    except Exception as e:
        logger.error("Error formatting transcription result: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to format transcription: {e}") from e

def extract_metadata_from_transcript(transcript: str) -> Dict[str, Any]:
    """Extract metadata such as meeting title, duration, and participants from transcript header"""
    metadata = {}
    
    # Look for meeting title
    title_match = re.search(r'Meeting:\s*(.+?)(?=[\n]|$)', transcript)
    if title_match:
        metadata["title"] = title_match.group(1).strip()
    
    # Look for duration
    duration_match = re.search(r'Duration:\s*(\d+)\s*minutes', transcript)
    if duration_match:
        metadata["duration_minutes"] = int(duration_match.group(1))
    
    # Look for date
    date_match = re.search(r'Date:\s*(.+?)(?=[\n]|$)', transcript)
    if date_match:
        metadata["date"] = date_match.group(1).strip()
    
    # Look for participants list
    participants_match = re.search(r'Participants:\s*(.+?)(?=[\n]{2}|$)', transcript, re.DOTALL)
    if participants_match:
        participants_text = participants_match.group(1)
        # Extract individual names
        participants = [p.strip() for p in re.findall(r'[-•]\s*([^\n,]+)', participants_text)]
        if participants:
            metadata["participants"] = participants
    
    return metadata

def clean_transcript_text(transcript: str) -> str:
    """Clean up transcript text to normalize formatting"""
    # Remove unnecessary whitespace
    cleaned = re.sub(r'\s+', ' ', transcript).strip()
    
    # Ensure consistent speaker format (Speaker: Text)
    cleaned = re.sub(r'([^\n:]+)\s*:\s*', r'\1: ', cleaned)
    
    # Ensure proper paragraph breaks between speakers
    cleaned = re.sub(r'([.!?])\s+([A-Z][^:]+:)', r'\1\n\2', cleaned)
    
    return cleaned

def format_transcript_for_export(transcript: str, format_type: str = "text") -> str:
    """Format transcript for export in different formats"""
    if format_type == "json":
        # Extract speakers and segments
        speakers = extract_speakers_from_transcript(transcript)
        segments = structure_transcript_by_speaker(transcript, speakers)
        
        # Create JSON structure
        export_data = {
            "transcript": transcript,
            "speakers": speakers,
            "segments": segments,
            "metadata": extract_metadata_from_transcript(transcript)
        }
        
        return json.dumps(export_data, indent=2)
    
    elif format_type == "text":
        return transcript
    
    elif format_type == "html":
        # Convert to HTML format with styling
        speakers = extract_speakers_from_transcript(transcript)
        speaker_colors = assign_speaker_colors(speakers)
        
        html = "<div class='transcript'>\n"
        
        # Add metadata if present
        metadata = extract_metadata_from_transcript(transcript)
        if metadata:
            html += "<div class='transcript-header'>\n"
            if "title" in metadata:
                html += f"<h2>{metadata['title']}</h2>\n"
            if "date" in metadata:
                html += f"<p><strong>Date:</strong> {metadata['date']}</p>\n"
            if "duration_minutes" in metadata:
                html += f"<p><strong>Duration:</strong> {metadata['duration_minutes']} minutes</p>\n"
            html += "</div>\n"
        
        # Process transcript text
        speaker_pattern = re.compile(r'^([^:\n]+):\s*(.*?)(?=^[^:\n]+:|$)', re.MULTILINE | re.DOTALL)
        for match in speaker_pattern.finditer(transcript):
            speaker_name = match.group(1).strip()
            text = match.group(2).strip()
            
            # Find speaker color
            speaker_id = next((s["id"] for s in speakers if s["name"] == speaker_name), "unknown")
            color = speaker_colors.get(speaker_id, "#333333")
            
            # Add speaker turn as HTML
            html += "<div class='speaker-turn'>\n"
            html += f"  <span class='speaker-name' style='color: {color};'>{speaker_name}</span>\n"
            html += f"  <div class='speaker-text'>{text}</div>\n"
            html += "</div>\n"
        
        html += "</div>"
        return html
    
    else:
        # Default to plain text
        return transcript
