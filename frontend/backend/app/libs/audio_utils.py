"""Audio extraction utilities for converting video files to audio.

This module provides functions to extract audio from video files using pydub.
Supports common video formats: mp4, mov, avi, webm, mkv
"""

import io
import logging
from typing import Optional, Tuple
from pydub import AudioSegment
import tempfile
import os

logger = logging.getLogger("dicta.audio_utils")

# Supported video formats
VIDEO_FORMATS = ['mp4', 'mov', 'avi', 'webm', 'mkv']
AUDIO_FORMATS = ['mp3', 'wav', 'm4a', 'webm', 'ogg', 'flac', 'aac']

def is_video_file(filename: str) -> bool:
    """Check if the file is a video file based on extension.
    
    Args:
        filename: The filename to check
        
    Returns:
        True if the file is a video file, False otherwise
    """
    extension = filename.split('.')[-1].lower()
    return extension in VIDEO_FORMATS

def is_audio_file(filename: str) -> bool:
    """Check if the file is an audio file based on extension.
    
    Args:
        filename: The filename to check
        
    Returns:
        True if the file is an audio file, False otherwise
    """
    extension = filename.split('.')[-1].lower()
    return extension in AUDIO_FORMATS

def extract_audio_from_video(video_data: bytes, filename: str, output_format: str = 'mp3') -> Tuple[bytes, str]:
    """Extract audio from video file bytes.
    
    Args:
        video_data: The video file data as bytes
        filename: The original filename (used to determine format)
        output_format: The desired output audio format (default: 'mp3')
        
    Returns:
        A tuple of (audio_bytes, content_type)
        
    Raises:
        ValueError: If the video format is not supported
        RuntimeError: If audio extraction fails
    """
    if not is_video_file(filename):
        raise ValueError(f"File {filename} is not a supported video format. Supported: {VIDEO_FORMATS}")
    
    # Get input format from filename
    input_format = filename.split('.')[-1].lower()
    
    # Create temporary files for processing
    temp_input_path = None
    temp_output_path = None
    
    try:
        # Write video data to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f'.{input_format}') as temp_input:
            temp_input.write(video_data)
            temp_input_path = temp_input.name
        
        logger.info("Extracting audio from video file: %s (format: %s)", filename, input_format)
        
        # Load video file with pydub
        # pydub will use ffmpeg in the background to extract audio
        audio = AudioSegment.from_file(temp_input_path, format=input_format)
        
        logger.debug("Audio extracted successfully. Duration: %.2fs", len(audio) / 1000)
        
        # Export to desired format in memory
        output_buffer = io.BytesIO()
        audio.export(output_buffer, format=output_format)
        audio_bytes = output_buffer.getvalue()
        
        # Determine content type
        content_type_map = {
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'm4a': 'audio/m4a',
            'webm': 'audio/webm',
            'ogg': 'audio/ogg',
            'flac': 'audio/flac',
            'aac': 'audio/aac'
        }
        content_type = content_type_map.get(output_format, 'audio/mpeg')
        
        logger.debug("Audio conversion complete. Output size: %.2f MB", len(audio_bytes) / 1024 / 1024)
        
        return audio_bytes, content_type
        
    except Exception as e:
        logger.error("Error extracting audio from video: %s", e)
        raise RuntimeError(f"Failed to extract audio from video: {str(e)}") from e
        
    finally:
        # Clean up temporary files
        if temp_input_path and os.path.exists(temp_input_path):
            try:
                os.unlink(temp_input_path)
            except Exception as e:
                logger.warning("Failed to delete temporary input file: %s", e)
        
        if temp_output_path and os.path.exists(temp_output_path):
            try:
                os.unlink(temp_output_path)
            except Exception as e:
                logger.warning("Failed to delete temporary output file: %s", e)

def process_uploaded_file(file_data: bytes, filename: str) -> Tuple[bytes, str, bool]:
    """Process an uploaded file, extracting audio if it's a video.
    
    Args:
        file_data: The uploaded file data as bytes
        filename: The original filename
        
    Returns:
        A tuple of (processed_data, content_type, was_video)
        
    Raises:
        ValueError: If the file format is not supported
        RuntimeError: If processing fails
    """
    if is_audio_file(filename):
        logger.debug("Audio file detected: %s. No extraction needed.", filename)
        extension = filename.split('.')[-1].lower()
        content_type_map = {
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'm4a': 'audio/m4a',
            'webm': 'audio/webm',
            'ogg': 'audio/ogg',
            'flac': 'audio/flac',
            'aac': 'audio/aac'
        }
        content_type = content_type_map.get(extension, 'audio/mpeg')
        return file_data, content_type, False
    elif is_video_file(filename):
        logger.info("Video file detected: %s. Extracting audio...", filename)
        audio_data, content_type = extract_audio_from_video(file_data, filename)
        return audio_data, content_type, True
    else:
        raise ValueError(f"Unsupported file format: {filename}. Supported formats: {AUDIO_FORMATS + VIDEO_FORMATS}")
