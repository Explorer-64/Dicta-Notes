
import concurrent.futures
import json
import logging
import subprocess
import time
import traceback
from app.apis.firebase import get_firestore_db
from app.apis.storage import get_audio_from_firebase
from app.apis.gemini_client import get_gemini_client
from app.apis.gemini_json_parser import process_gemini_transcription_json
import tempfile
import os

logger = logging.getLogger("dicta.transcription_utils")


def _detect_mime_type(audio_data: bytes, audio_path: str) -> str:
    """Detect audio MIME type from file extension and magic bytes."""
    # Check file extension first
    ext = audio_path.rsplit(".", 1)[-1].lower() if "." in audio_path else ""
    ext_map = {
        "mp3": "audio/mp3",
        "wav": "audio/wav",
        "ogg": "audio/ogg",
        "flac": "audio/flac",
        "aac": "audio/aac",
        "m4a": "audio/mp4",
        "webm": "audio/webm",
        "mp4": "audio/mp4",
    }
    if ext in ext_map:
        return ext_map[ext]

    # Check magic bytes
    if audio_data[:4] == b"fLaC":
        return "audio/flac"
    if audio_data[:3] == b"ID3" or audio_data[:2] == b"\xff\xfb":
        return "audio/mp3"
    if audio_data[:4] == b"RIFF":
        return "audio/wav"
    if audio_data[:4] == b"OggS":
        return "audio/ogg"
    if audio_data[4:8] == b"ftyp":
        return "audio/mp4"
    if audio_data[:4] == b"\x1a\x45\xdf\xa3":
        return "audio/webm"

    # Default to webm (browser recording format)
    return "audio/webm"


def _get_audio_duration(audio_data: bytes) -> float:
    """Try to get audio duration using pydub. Returns 0.0 on failure."""
    temp_path = None
    try:
        from pydub import AudioSegment

        with tempfile.NamedTemporaryFile(delete=False, suffix=".tmp") as f:
            f.write(audio_data)
            temp_path = f.name

        audio = AudioSegment.from_file(temp_path)
        # Guard against pydub internal division by zero (frame_width=0)
        if audio.frame_width == 0 or audio.frame_rate == 0:
            logger.warning("Audio has 0 frame_width or frame_rate, cannot compute duration")
            return 0.0
        duration = len(audio) / 1000.0
        logger.info(f"Audio duration: {duration:.2f} seconds")
        return duration
    except Exception as e:
        logger.warning("Could not determine audio duration: %s", e)
        return 0.0
    finally:
        if temp_path:
            try:
                os.unlink(temp_path)
            except OSError:
                pass


def _remux_audio_to_mp3(audio_data: bytes) -> tuple:
    """
    Remux audio through ffmpeg with error-recovery flags to work around missing/corrupt
    WebM cues (seek index) common in browser MediaRecorder recordings.
    Returns (mp3_bytes, duration_seconds) or (None, 0.0) on failure.
    """
    temp_in = temp_out = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".tmp") as f:
            f.write(audio_data)
            temp_in = f.name
        temp_out = temp_in + ".mp3"

        result = subprocess.run(
            [
                "ffmpeg", "-y",
                "-err_detect", "ignore_err",
                "-fflags", "+discardcorrupt+genpts",
                "-i", temp_in,
                "-acodec", "libmp3lame", "-ab", "128k",
                temp_out,
            ],
            capture_output=True,
            timeout=30,
            env=_get_ffprobe_env(),
        )

        if result.returncode != 0 or not os.path.exists(temp_out):
            logger.warning("ffmpeg remux failed (code %d): %s", result.returncode, result.stderr[-500:])
            return None, 0.0

        with open(temp_out, "rb") as f:
            mp3_data = f.read()

        # Compute duration from the cleanly-remuxed file
        from pydub import AudioSegment
        audio = AudioSegment.from_file(temp_out)
        duration = len(audio) / 1000.0
        logger.info("Remuxed audio to MP3: %d bytes, %.2fs", len(mp3_data), duration)
        return mp3_data, duration

    except Exception as e:
        logger.warning("Audio remux exception: %s", e)
        return None, 0.0
    finally:
        for p in (temp_in, temp_out):
            if p and os.path.exists(p):
                try:
                    os.unlink(p)
                except OSError:
                    pass


def _find_ffmpeg_bin() -> str:
    """
    Find the directory containing ffprobe.exe on Windows by searching known
    WinGet and Chocolatey install locations. Returns "" if already on PATH
    or not found (Linux/Mac use standard PATH).
    """
    import shutil
    if shutil.which("ffprobe"):
        return ""
    if os.name == "nt":
        winget_base = os.path.expanduser(r"~\AppData\Local\Microsoft\WinGet\Packages")
        if os.path.isdir(winget_base):
            for pkg in os.listdir(winget_base):
                if "FFmpeg" in pkg or "ffmpeg" in pkg:
                    for root, dirs, files in os.walk(os.path.join(winget_base, pkg)):
                        if "ffprobe.exe" in files:
                            return root
        choco = r"C:\ProgramData\chocolatey\bin"
        if os.path.isfile(os.path.join(choco, "ffprobe.exe")):
            return choco
    return ""


def _get_ffprobe_env() -> dict:
    """
    Build an environment dict that includes ffprobe's location.
    On Linux/Mac (Docker), standard PATH already contains ffprobe.
    On Windows (dev), winget installs to a non-PATH location — find it directly.
    """
    env = os.environ.copy()
    extra = _find_ffmpeg_bin()
    if extra:
        sep = ";" if os.name == "nt" else ":"
        env["PATH"] = extra + sep + env.get("PATH", "")
        logger.info("Added ffmpeg to subprocess PATH: %s", extra)
    return env


def _get_container_duration_ffprobe(audio_data: bytes, audio_path: str) -> float:
    """
    Read the WebM container duration via ffprobe. This matches what the browser
    reports (wall-clock time) rather than pydub's audio-sample count, which
    diverges for MediaRecorder WebM files that lack a Cues/seek index.
    Returns 0.0 on failure.
    """
    if os.environ.get("K_SERVICE"):
        # ffprobe consistently times out on Cloud Run — skip it and let the
        # caller fall back to session-stored or pydub duration.
        return 0.0
    temp_path = None
    try:
        ext = audio_path.rsplit(".", 1)[-1].lower() if "." in audio_path else "tmp"
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as f:
            f.write(audio_data)
            temp_path = f.name

        result = subprocess.run(
            [
                "ffprobe", "-v", "quiet",
                "-print_format", "json",
                "-show_entries", "format=duration",
                "-probesize", "10000000",
                "-analyzeduration", "10000000",
                temp_path,
            ],
            capture_output=True,
            timeout=60,
            env=_get_ffprobe_env(),
        )
        if result.returncode != 0:
            logger.warning("ffprobe failed (code %d): %s", result.returncode, result.stderr[-300:])
            return 0.0

        info = json.loads(result.stdout)
        duration = float(info.get("format", {}).get("duration", 0))
        return duration
    except Exception as e:
        logger.warning("ffprobe container duration failed: %s", e)
        return 0.0
    finally:
        if temp_path:
            try:
                os.unlink(temp_path)
            except OSError:
                pass


def process_transcription_job(session_id: str, user_id: str, client_audio_duration: float | None = None):
    """
    The core function that runs in the background to transcribe an audio file from Firebase Storage.
    """
    logger.info(f"Starting on-demand transcription job for session: {session_id}")
    firestore_db = get_firestore_db()
    session_ref = firestore_db.collection("sessions").document(session_id)

    try:
        # 1. Fetch session document
        session_doc = session_ref.get()
        if not session_doc.exists:
            raise ValueError("Session document not found.")

        session_data = session_doc.to_dict()
        audio_url = session_data.get("audio_key") or session_data.get("audio_url")
        if not audio_url:
            raise ValueError("Audio path not found in session document.")

        # Extract storage path from Firebase URL if it's a full URL
        if audio_url.startswith("https://storage.googleapis.com/"):
            # Extract path after bucket name
            # URL format: https://storage.googleapis.com/BUCKET_NAME/PATH
            parts = audio_url.split("/")
            if len(parts) >= 5:
                audio_path = "/".join(parts[4:])  # Everything after bucket name
            else:
                raise ValueError("Invalid Firebase Storage URL format.")
        else:
            audio_path = audio_url

        # 2. Download audio from Firebase Storage
        logger.info(f"Downloading audio from: {audio_path}")
        audio_data = get_audio_from_firebase(audio_path)
        if not audio_data:
            raise ValueError("Failed to download audio from Firebase Storage.")

        logger.info(f"Audio downloaded, size: {len(audio_data)} bytes")

        # Detect actual MIME type from audio data
        mime_type = _detect_mime_type(audio_data, audio_path)
        logger.info(f"Detected audio MIME type: {mime_type}")

        # Check known durations first — avoid expensive pydub/ffprobe if not needed.
        session_stored_duration = float(session_data.get("duration") or 0)

        # Only WebM files need ffprobe container duration (for drift correction) and remuxing.
        # MP3, M4A, WAV, FLAC, AAC are already in clean formats Gemini handles fine.
        needs_remux = mime_type in ("audio/webm", "audio/ogg")

        if needs_remux:
            # Get the authoritative container duration BEFORE remuxing.
            # ffprobe reads the WebM cluster timestamps (wall-clock time) which matches
            # what the browser reports. pydub counts audio samples and diverges for
            # MediaRecorder WebM files → this is the correct reference for drift correction.
            container_duration = _get_container_duration_ffprobe(audio_data, audio_path)
            pydub_duration = _get_audio_duration(audio_data)
            logger.info("Container duration: %.2fs, pydub: %.2fs", container_duration, pydub_duration)

            remuxed_data, _ = _remux_audio_to_mp3(audio_data)
            if remuxed_data:
                audio_data = remuxed_data
                mime_type = "audio/mp3"
                logger.info("Remuxed to MP3 for Gemini input")
            else:
                logger.warning("Remux failed; falling back to original audio for transcription")
        else:
            logger.info("Skipping remux — audio is already in a clean format (%s)", mime_type)
            container_duration = 0.0
            # Only call pydub if we don't already have a reliable duration
            if client_audio_duration and client_audio_duration > 0:
                pydub_duration = 0.0
            elif session_stored_duration > 0:
                pydub_duration = 0.0
            else:
                pydub_duration = _get_audio_duration(audio_data)

        # Use client-provided duration first (most accurate — browser's HTMLAudioElement.duration).
        # Also check the Firestore session document for stored duration (set when recording ends).
        # Fall back to ffprobe container duration, then pydub, then estimate from file size.
        if client_audio_duration and client_audio_duration > 0:
            actual_duration = client_audio_duration
            logger.info("Using client-provided duration: %.2fs", actual_duration)
        elif session_stored_duration > 0:
            actual_duration = session_stored_duration
            logger.info("Using session-stored duration: %.2fs", actual_duration)
        elif container_duration > 0:
            actual_duration = container_duration
        elif pydub_duration > 0:
            actual_duration = pydub_duration
        else:
            actual_duration = max(10.0, (len(audio_data) / 1024) / 25)
            logger.info("Using estimated duration from file size: %.1fs", actual_duration)

        # 3. Transcribe with Gemini API
        model = get_gemini_client("models/gemini-2.5-flash")
        
        meeting_title = session_data.get("title", "General Discussion")
        
        # This is a simplified prompt for now. We can enhance it later.
        transcription_prompt = f"""
You are a professional audio transcription system with speaker identification and language separation capabilities.

Please transcribe this audio recording and identify different speakers.

Meeting title: {meeting_title}

CRITICAL LANGUAGE SEPARATION INSTRUCTIONS:
1. NEVER mix different languages within the same segment
2. When a speaker switches languages mid-sentence or between sentences, create a NEW segment
3. Each segment must contain ONLY ONE language
4. Detect language changes at the sentence/phrase level, not just speaker level
5. Mark each segment with the appropriate language code ("en", "es", "fr", etc.)
6. If unsure about language, err on the side of creating separate segments

General Instructions:
1. Transcribe all speech accurately
2. Identify different speakers and assign them consistent names
   
   **CRITICAL NAMING PROCESS - FOLLOW THIS EXACT ORDER:**

   **STEP 1 - SELF-INTRODUCTION DETECTION (ABSOLUTE PRIORITY):**
   - SCAN FOR: "I'm [Name]", "My name is [Name]", "This is [Name]", "[Name] here", "I am [Name]"
   - WHEN DETECTED: Use the EXACT name spoken by that person for ALL their segments
   - CONFIDENCE: Set to 0.98 for self-identified speakers
   - EXAMPLE: If someone says "I'm Travis Kelsey", label ALL segments from that voice as "Travis Kelsey"
   - THIS OVERRIDES ALL OTHER IDENTIFICATION METHODS

   **STEP 2 - VOICE CONSISTENCY:**
   - After identifying a speaker's name (Step 1), use voice characteristics to assign remaining segments
   - Do NOT guess names that weren't self-introduced

   **STEP 3 - ACCURACY TECHNIQUE:**
   - After a speaker introduces themselves, pay extremely close attention to voice characteristics in the seconds immediately following
   - Use this post-introduction audio to create a definitive "voice fingerprint" for that speaker
   - This helps confirm the identity and avoid incorrect assignments

   **STEP 4 - FALLBACK FOR UNIDENTIFIED SPEAKERS:**
   - CONSISTENT UNIDENTIFIED SPEAKERS: For speakers who speak multiple times but don't introduce themselves, assign consistent generic labels ("Speaker 1", "Speaker 2")
   - MOMENTARY UNKNOWN UTTERANCES: If you cannot be certain which established speaker said something, label as "Unknown"
   - NEVER guess a name that wasn't self-introduced
   
   **STEP 5 - CONFIDENCE SCORES:**
   - Self-identified speakers: 0.98 confidence
   - Generic speakers ("Speaker 1"): 0.65-0.85 based on voice consistency
   - If confidence for ANY speaker is below threshold, use "Unknown" with no confidence score

3. Format as JSON with this structure, replacing the example values with the actual identified data:
{{
    "meeting_title": "{meeting_title}",
    "speakers": [
        {{"id": "s1", "name": "Actual Speaker Name 1", "confidence": 0.95}},
        {{"id": "s2", "name": "Actual Speaker Name 2", "confidence": 0.88}}
        // ... and so on for all identified speakers
    ],
    "segments": [
        {{
            "speaker": {{"id": "s1", "name": "Actual Speaker Name 1", "confidence": 0.95}},
            "text": "What they said in their own language",
            "start_time": 0.0,
            "end_time": 5.0,
            "language": "en"
        }},
        {{
            "speaker": {{"id": "s2", "name": "Actual Speaker Name 2", "confidence": 0.88}},
            "text": "Lo que dijeron en su idioma",
            "start_time": 5.1,
            "end_time": 10.5,
            "language": "es"
        }}
        // ... and so on for all segments
    ],
    "languages_detected": ["en", "es"],
    "duration": {actual_duration:.1f}
}}

EXAMPLE of proper language separation:
If someone says "Hello everyone, bienvenidos a la reunión", create TWO segments:
- Segment 1: "Hello everyone" (language: "en")
- Segment 2: "bienvenidos a la reunión" (language: "es")

IMPORTANT: Return only valid JSON, no extra text or markdown formatting.
        """
        
        logger.info("Sending audio to Gemini for transcription...")
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(
                model.generate_content,
                contents=[
                    {"role": "user", "parts": [
                        {"text": transcription_prompt},
                        {"inline_data": {"mime_type": mime_type, "data": audio_data}}
                    ]}
                ]
            )
            response = future.result(timeout=600)

        gemini_response_text = response.text
        logger.info("Received response from Gemini.")

        # Process the response to get structured data
        storage_data, _ = process_gemini_transcription_json(
            gemini_response_text=gemini_response_text,
            original_audio_key=audio_path,
            original_audio_url=session_data.get("url"),
            firebase_audio_path=audio_path,
            session_id=session_id,
            actual_audio_duration=actual_duration,
        )

        # 4. Update session doc with transcript_data and status='completed'
        session_ref.update({
            "transcript_data": storage_data,
            "transcription_status": "completed",
            # Also populate root-level fields for compatibility with V1 session display
            "speakers": storage_data.get("speakers", []),
            "segments": storage_data.get("segments", []),
            "full_text": storage_data.get("full_text", "")
        })
        
        logger.info(f"Finished transcription job for session: {session_id}")

    except Exception as e:
        # Log the FULL traceback so we can see exactly which line failed
        logger.error("Error during transcription job for session %s: %s", session_id, e)
        logger.error("Full traceback:\n%s", traceback.format_exc())
        # Update session doc with status='failed' and error message
        try:
            session_ref.update({
                "transcription_status": "failed",
                "transcription_error": str(e)
            })
        except Exception as update_error:
            logger.error("Additionally failed to update session with error status: %s", update_error)
