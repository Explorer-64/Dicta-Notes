/**
 * Language utility functions for the application
 */

/**
 * Maps language codes to their full names
 * @param code ISO 639-1 language code
 * @returns The full name of the language or the code if not found
 */
export const getLanguageName = (code: string): string => {
  const languages: Record<string, string> = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "zh": "Chinese",
    "ja": "Japanese",
    "ko": "Korean",
    "pt": "Portuguese",
    "ru": "Russian",
    "it": "Italian",
    "ar": "Arabic",
    "hi": "Hindi",
    "bn": "Bengali",
    "tr": "Turkish",
    "vi": "Vietnamese",
    "th": "Thai",
    "nl": "Dutch",
    "sv": "Swedish",
    "fi": "Finnish",
    "pl": "Polish",
    "uk": "Ukrainian"
  };
  return languages[code] || code;
};

/**
 * Returns the text direction for a given language code
 * @param languageCode ISO 639-1 language code
 * @returns "rtl" for right-to-left languages, "ltr" otherwise
 */
export const getTextDirection = (languageCode?: string): "rtl" | "ltr" => {
  const rtlLanguages = ["ar", "he", "ur", "fa", "ps", "sd"];
  return languageCode && rtlLanguages.includes(languageCode) ? "rtl" : "ltr";
};
