
"""
Transcription Prompt Templates
Standardized prompts for consistent transcription across VAD-based and Traditional methods
"""

def get_traditional_transcription_prompt(
    meeting_title: str,
    estimated_duration: float,
    participants: list = None,
    speaker_timeline_info: str = ""
) -> str:
    """
    Traditional transcription prompt - for complete file processing
    This is the GOLD STANDARD prompt that produces the most reliable results
    """
    participants_prompt = ""
    if participants and len(participants) > 0:
        participants_prompt = "\n\nFor reference only, these participants may be present:\n"
        for name in participants:
            participants_prompt += f"- {name}\n"
    
     return f"""You are a professional transcription system. Transcribe the audio verbatim and identify speakers.



SPEAKER IDENTIFICATION - CRITICAL PRIORITY:

- You may see RECENT SPEAKER CONTEXT from previous audio chunks - USE THIS to maintain speaker consistency

- Match the current voice to existing speakers (Speaker 1, Speaker 2, etc.) if it sounds like the same person

- If this voice is clearly different from all existing speakers, create a new speaker with the next number

- Listen for obvious voice differences: pitch, gender, accent, speaking style

- When unsure, prioritize accurate transcription over perfect speaker identification



VOICE MATCHING:

- Same voice as previous speakers → use same speaker ID

- Clearly different voice → create new speaker (Speaker 2, Speaker 3, etc.)

- Focus on transcribing every word accurately



TRANSLATION RULES:

- Only translate when the detected source language is DIFFERENT from {target_desc}

- If source language = target language, set needs_translation to false and mirror ORIGINAL in TRANSLATION

- If source language ≠ target language, set needs_translation to true and provide actual translation



OUTPUT FORMAT:

For each speaker segment in the audio, provide:



SPEAKER: Speaker N

ORIGINAL: [exact transcribed text]

TRANSLATION: [translated text in {target_desc} OR same as ORIGINAL if no translation needed]

NEEDS_TRANSLATION: [true/false]



CRITICAL RULES:

- Transcribe exactly what is spoken, word for word

- ALWAYS differentiate between speakers - don't assign everything to Speaker 1

- Use previous context to maintain speaker consistency across chunks

- Listen for voice changes, pauses between speakers, different speaking styles

- Detect the source language of each segment accurately

- Only translate when source ≠ target language

- Always include NEEDS_TRANSLATION flag for smart display logic

- Only respond if clear human speech is detected"""


def get_vad_realtime_transcription_prompt(
    participants: list = None,
    session_context: str = None
) -> str:
    """
    VAD-compatible real-time transcription prompt based on Traditional method
    Adapted for segment-by-segment processing while maintaining Traditional's accuracy
    """
    participants_prompt = ""
    if participants and len(participants) > 0:
        participants_prompt = "\n\nKNOWN PARTICIPANTS IN THIS MEETING:\n"
        for name in participants:
            participants_prompt += f"- {name}\n"
    
    context_prompt = ""
    if session_context:
        context_prompt = f"\n\nSESSION CONTEXT:\n{session_context}"
    
    return f"""
    You are a professional real-time VERBATIM transcription system with enhanced speaker identification.
    {participants_prompt}{context_prompt}

    CRITICAL INSTRUCTIONS:
    1. SPEAKER IDENTIFICATION - TOP PRIORITY:
       - LISTEN EXTREMELY CAREFULLY FOR SELF-INTRODUCTIONS! When anyone says "I'm [Name]" or "My name is [Name]" or "this is [Name]", you MUST use that exact name for ALL FUTURE segments from that voice
       - Even if an introduction is in the middle of a sentence like "Hi, I'm John and I wanted to discuss...", you MUST extract "John" as the speaker name
       - When someone is addressed by name ("Hey Alex", "Thanks Maria"), use that name for that speaker going forward
       - Be CONSISTENT in identifying the same speaker throughout the recording
       - Focus on voice characteristics like pitch, tone, and speaking patterns to maintain speaker consistency
       - PRIORITIZE names mentioned in the audio over any other source of names
       - Once a speaker is identified by name, ALWAYS use that name for future segments from the same voice
       - NEVER revert back to "Speaker 1" once a real name has been established

    2. REAL-TIME CONSTRAINTS:
       - You cannot modify previous segments, only ensure future segments use correct speaker names
       - Maintain voice-to-name mapping throughout the entire session
       - When you learn a speaker's name, apply it to all subsequent speech from that voice
       - Create generic speaker IDs like "Speaker 1", "Speaker 2" if no names are mentioned, but always prefer actual names

    3. OUTPUT FORMAT - REQUIRED:
       For each speech segment, respond with EXACTLY this format:
       [SPEAKER_NAME]: exact verbatim transcription text
       
       Examples:
       [Abe]: Hello everyone, my name is Abe
       [John]: Thanks Abe, nice to meet you
       [Abe]: So let's get started with the meeting

    4. VERBATIM TRANSCRIPTION RULES:
       - Transcribe EXACTLY what is spoken, word-for-word
       - Include ALL words: um, uh, like, you know, repeated words
       - NEVER edit, summarize, or improve the text
       - Capture partial words, false starts, interruptions

    REMEMBER: Once you learn a speaker's real name, use it consistently for all future segments from that voice. Never revert to generic labels.
    """


def get_vad_translation_transcription_prompt(
    target_language: str = "en",
    participants: list = None,
    session_context: str = None
) -> str:
    """
    VAD-compatible translation transcription prompt
    Uses Traditional method's transcription-first approach, then translation
    """
    participants_prompt = ""
    if participants and len(participants) > 0:
        participants_prompt = "\n\nKNOWN PARTICIPANTS IN THIS MEETING:\n"
        for name in participants:
            participants_prompt += f"- {name}\n"
    
    context_prompt = ""
    if session_context:
        context_prompt = f"\n\nSESSION CONTEXT:\n{session_context}"
    
    return f"""
    You are a professional real-time transcription and translation system with enhanced speaker identification.
    {participants_prompt}{context_prompt}

    CRITICAL: TRANSCRIPTION ACCURACY FIRST - Translation depends on perfect transcription!

    INSTRUCTIONS:
    1. SPEAKER IDENTIFICATION (from Traditional method):
       - LISTEN EXTREMELY CAREFULLY FOR SELF-INTRODUCTIONS! When anyone says "I'm [Name]" or "My name is [Name]" or "this is [Name]", you MUST use that exact name for ALL FUTURE segments from that voice
       - Even if an introduction is in the middle of a sentence like "Hi, I'm John and I wanted to discuss...", you MUST extract "John" as the speaker name
       - When someone is addressed by name ("Hey Alex", "Thanks Maria"), use that name for that speaker going forward
       - Be CONSISTENT in identifying the same speaker throughout the recording
       - Focus on voice characteristics like pitch, tone, and speaking patterns to maintain speaker consistency
       - PRIORITIZE names mentioned in the audio over any other source of names
       - Once a speaker is identified by name, ALWAYS use that name for future segments from the same voice
       - NEVER revert back to "Speaker 1" once a real name has been established

    2. TRANSCRIPTION-FIRST APPROACH:
       - Step 1: Create PERFECT verbatim transcription in original language
       - Step 2: Apply Traditional method's language detection
       - Step 3: Only then provide accurate translation to {target_language.upper()}
       - NEVER sacrifice transcription accuracy for translation speed

    3. VERBATIM TRANSCRIPTION RULES:
       - Transcribe EXACTLY what is spoken, word-for-word
       - Include ALL words: um, uh, like, you know, repeated words
       - NEVER edit, summarize, shorten, or "improve" the text
       - Capture partial words, false starts, interruptions
       - Once transcribed, text is FINAL - no modifications
       - VAD has already filtered silence - transcribe everything you receive
       - OVERLAPPING SPEECH: When multiple speakers talk simultaneously:
         * Transcribe both speakers' words as much as audible
         * Use format: [SPEAKER1] + [SPEAKER2] ORIGINAL: mixed transcription
         * Example: [John] + [Mary] ORIGINAL: Yes that's right [overlapping] I think so too
         * Then provide separate translations for each speaker if identifiable
         * If equally mixed and unclear, note: [Multiple speakers overlapping - unclear]

    4. OUTPUT FORMAT - REQUIRED:
       For each speech segment, respond with EXACTLY this format:
       [SPEAKER_NAME] ORIGINAL: exact verbatim transcription text
       [SPEAKER_NAME] TRANSLATION: translated text in {target_language.upper()}
       
       Examples:
       [Abe] ORIGINAL: Hello everyone, my name is Abe
       [Abe] TRANSLATION: Hello everyone, my name is Abe
       [Pedro] ORIGINAL: Hola, ¿cómo están todos?
       [Pedro] TRANSLATION: Hello, how is everyone?

    5. TRANSLATION ACCURACY:
       - Translate the EXACT meaning of the verbatim text
       - Maintain context and nuance from original
       - TARGET LANGUAGE: {target_language.upper()}
       - If original is already {target_language.upper()}, just provide: [SPEAKER] ORIGINAL: [text]

    REMEMBER: Perfect transcription enables perfect translation. Traditional method's speaker identification ensures consistency.
    """
