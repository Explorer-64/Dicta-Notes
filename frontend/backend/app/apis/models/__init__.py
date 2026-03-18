
# Consolidated models module containing all application models
# This module includes both core transcription models and extended models for sessions, documents, etc.
import time
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from fastapi import APIRouter

# Create router
router = APIRouter()

# Core Transcription Models

class TranscriptionRequest(BaseModel):
    audio_data: str  # base64 encoded audio data
    filename: str
    content_type: str = "audio/webm"
    meeting_title: Optional[str] = None  # May contain embedded speaker timeline data
    participants: Optional[List[str]] = None
    session_id: Optional[str] = None  # ID of the session for live updates
    recording_start_time: Optional[int] = None  # Timestamp when recording actually started (for elapsed time calculation)
    # Additional metadata fields for fire-and-forget session saving
    client_name: Optional[str] = None
    project_name: Optional[str] = None
    tags: Optional[List[str]] = None
    meeting_purpose: Optional[str] = None
    language_preference: Optional[str] = None

# Pydantic model for a speaker
class Speaker(BaseModel):
    id: str
    name: str
    confidence: Optional[float] = None # Add optional confidence score

# Pydantic model for a transcription segment
class TranscriptionSegment(BaseModel):
    speaker: Speaker # Will store {"id": "speaker_id", "name": "Speaker Name"}
    text: str
    language: str = "unknown"  # ISO 639-1 code with default value
    start_time: float
    end_time: float

class TranscriptionResponse(BaseModel):
    session_id: str # Keep track of the session
    full_text: str # Generated from all segments
    meeting_title: str = "Meeting Transcription"
    duration: float = 0.0
    segments: List[TranscriptionSegment] = [] # Should now be reliably populated
    speakers: List[Speaker] = [] # Should now be reliably populated
    languages_detected: List[str] = [] # List of ISO 639-1 codes
    audio_key: Optional[str] = None # For databutton storage
    audio_url: Optional[str] = None # For firebase storage, if available
    timestamp: Optional[str] = None # ISO format timestamp of when transcription was saved

# Extended Models for Sessions, Documents, etc.

class VerificationRequest(BaseModel):
    code: Optional[str] = None
    requireVerification: bool = False

class DocumentMetadata(BaseModel):
    title: Optional[str] = None
    scheduled_date: Optional[str] = None
    scheduled_time: Optional[str] = None
    expected_attendees: Optional[List[str]] = None
    document_type: Optional[str] = None
    extracted_text: Optional[str] = None

class SessionDocument(BaseModel):
    id: str
    document_data: str  # base64 encoded image
    metadata: Optional[DocumentMetadata] = None
    created_at: float
    
class Session(BaseModel):
    id: str
    title: str
    transcript_id: Optional[str] = None
    full_text: Optional[str] = None
    audio_key: Optional[str] = None
    audio_url: Optional[str] = None
    duration: Optional[float] = None
    speakers: Optional[List[Speaker]] = None
    segments: Optional[List[TranscriptionSegment]] = None
    created_at: float
    documents: Optional[List[SessionDocument]] = None
    metadata: Optional[Dict[str, Any]] = None

class SessionListItem(BaseModel):
    id: str
    title: str
    created_at: float
    duration: Optional[float] = None
    has_documents: bool
    speakers_count: Optional[int] = None
    audio_key: Optional[str] = None
    audio_url: Optional[str] = None
    # Add metadata fields for sessions UI display
    client_name: Optional[str] = None
    project_name: Optional[str] = None
    tags: Optional[List[str]] = None
    meeting_purpose: Optional[str] = None

class SessionList(BaseModel):
    sessions: List[SessionListItem]
    total_count: int
    
class SaveSessionRequest(BaseModel):
    session_id: Optional[str] = None  # For updating an existing session
    title: str
    transcript_id: Optional[str] = None
    full_text: Optional[str] = None
    duration: Optional[float] = None
    audio_key: Optional[str] = None
    client_name: Optional[str] = None
    project_name: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    time_spent: Optional[float] = None  # Additional time spent editing, in minutes

    # --- New Freelancer Fields ---
    # client_name, project_name, and tags are already included above
    # --- End New Fields ---

class SaveSessionResponse(BaseModel):
    session_id: str
    success: bool
    
class AddDocumentRequest(BaseModel):
    session_id: str
    document_data: str  # base64 encoded image
    filename: Optional[str] = None
    content_type: Optional[str] = None
    document_type: Optional[str] = None

class AddDocumentResponse(BaseModel):
    document_id: str
    success: bool
    metadata: Optional[DocumentMetadata] = None

from typing import Literal

class ExportOptionsModel(BaseModel):
    # template: Optional[Literal['standard', 'modern', 'minimal', 'legal']] = 'standard' # Made template optional with default
    includeHeader: bool = False
    includeFooter: bool = False
    headerText: Optional[str] = None # Made optional
    footerText: Optional[str] = None # Made optional
    timestampFrequency: Literal['none', 'every-speaker', 'every-5-minutes', 'every-minute'] = 'every-speaker' # Added default
    includeClientProjectInfo: bool = True # Kept required, matches frontend default state
    includeBranding: bool = False # Added, default false
    professionalTemplate: Literal['standard', 'modern', 'minimal', 'legal'] = 'standard' # Added default
    includeNotes: bool = True # Kept required, matches frontend default state

class ExportSessionRequest(BaseModel):
    session_id: str # <-- Added session_id here
    format: Literal['txt', 'json', 'md', 'pdf', 'docx']
    options: ExportOptionsModel

# Speaker Name Update Models
class UpdateSpeakerNamesRequest(BaseModel):
    speaker_mappings: Dict[str, str]  # e.g., {"Speaker 1": "John Smith", "Speaker 2": "Jane Doe"}

class UpdateSpeakerNamesResponse(BaseModel):
    success: bool
    session_id: str
    updated_speakers: List[Speaker]
    message: Optional[str] = None
