import json
from typing import List, Dict
from app.libs.storage_manager import get_text, put_text

CONFIG_KEY = "google_stt_config.json"

DEFAULT_LANGUAGES = ["en-US", "es-ES", "fr-FR", "de-DE"]

def get_language_config() -> List[str]:
    """
    Retrieves the list of preferred languages from storage.
    If the config doesn't exist, it creates it with default values.
    """
    try:
        config_str = get_text(CONFIG_KEY)
        if not config_str:
            raise FileNotFoundError("Config not found")
        config = json.loads(config_str)
        return config.get("languages", DEFAULT_LANGUAGES)
    except FileNotFoundError:
        # Config doesn't exist, create it with defaults
        set_language_config(DEFAULT_LANGUAGES)
        return DEFAULT_LANGUAGES
    except (json.JSONDecodeError, TypeError):
        # Handle cases where the stored data is corrupted or not in the expected format
        set_language_config(DEFAULT_LANGUAGES)
        return DEFAULT_LANGUAGES

def set_language_config(languages: List[str]) -> None:
    """
    Saves a new list of preferred languages to storage.
    """
    if not isinstance(languages, list) or len(languages) > 4:
        raise ValueError("Language configuration must be a list of up to 4 language codes.")
    
    config = {"languages": languages}
    put_text(CONFIG_KEY, json.dumps(config, indent=2))

def ensure_config_exists() -> None:
    """
    Ensures the language configuration file exists in storage, creating it if necessary.
    This can be called on app startup if needed.
    """
    get_language_config()
