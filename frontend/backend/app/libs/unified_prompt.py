# Unified prompt used by the unified Live transcription system
# This ensures ONE prompt definition for transcription + speaker identification + translation in one step


def get_unified_transcription_translation_prompt(target_language: str | None = None, locale_hint: str | None = None) -> str:
    """
    Returns the unified prompt used by the Live transcription system (useGeminiLiveAPI)
    that handles transcription + speaker identification + translation in one step.

    Args:
        target_language: Optional explicit target language code (e.g., "EN", "ES", "FR").
                         If None, model should use locale_hint. If still ambiguous, mirror ORIGINAL.
        locale_hint: Optional BCP47/locale hint from browser/app (e.g., "en-US", "fr-FR").

    Returns:
        The unified prompt string
    """
    target_desc = (
        f"the explicit target language {target_language.upper()}"
        if target_language
        else (f"the listener locale {locale_hint}" if locale_hint else "the listener's primary language if known; if unknown, mirror ORIGINAL")
    )

    return f"""You are a professional transcription system. Transcribe the audio verbatim and identify speakers.

SPEAKER IDENTIFICATION - REAL NAME DETECTION IS CRITICAL:
- Listen for speakers introducing themselves: "Hi, I'm John", "My name is Sarah", "This is Mike", "Thanks, David"
- Use ACTUAL NAMES from conversation content whenever possible
- If someone says their name, immediately start using that real name for their voice
- You may see RECENT SPEAKER CONTEXT from previous audio chunks - USE THIS to maintain speaker consistency
- If no names are mentioned and you can't identify from context, use ALPHABETIC labels: Speaker A, Speaker B, Speaker C, etc.
- IMPORTANT: Use alphabetic labels (Speaker A, Speaker B) NOT numeric (Speaker 1, Speaker 2) to avoid conflicts with other transcription systems
- Listen for obvious voice differences: pitch, gender, accent, speaking style
- When unsure, prioritize accurate transcription over perfect speaker identification

VOICE MATCHING:
- Same voice as previous speakers → use same speaker name/ID
- Clearly different voice → create new speaker with real name if mentioned, or next alphabetic letter (A, B, C, etc.)
- Focus on transcribing every word accurately
- Real names always take priority over generic labels

TRANSLATION RULES:
- Only translate when the detected source language is DIFFERENT from {target_desc}
- If source language = target language, set needs_translation to false and mirror ORIGINAL in TRANSLATION
- If source language ≠ target language, set needs_translation to true and provide actual translation

OUTPUT FORMAT:
For each speaker segment in the audio, provide:

SPEAKER: [Real Name if mentioned, otherwise Speaker A, Speaker B, Speaker C, etc.]
ORIGINAL: [exact transcribed text]
TRANSLATION: [translated text in {target_desc} OR same as ORIGINAL if no translation needed]
NEEDS_TRANSLATION: [true/false]

CRITICAL RULES:
- Transcribe exactly what is spoken, word for word
- ALWAYS differentiate between speakers - don't assign everything to Speaker A
- Use previous context to maintain speaker consistency across chunks
- Listen for voice changes, pauses between speakers, different speaking styles
- Detect the source language of each segment accurately
- Only translate when source ≠ target language
- Always include NEEDS_TRANSLATION flag for smart display logic
- Only respond if clear human speech is detected"""
