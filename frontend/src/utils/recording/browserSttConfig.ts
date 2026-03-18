// Lightweight config toggle for Browser STT display behavior
// Modes:
// - "pure": UI renders only Web Speech interim/final callbacks (no Firestore dependency)
// - "hybrid"/"firestore": reserved for future use

export type BrowserSttMode = "pure" | "hybrid" | "firestore";

let BROWSER_STT_MODE: BrowserSttMode = "pure"; // Default per MYA-546

export const getBrowserSttMode = (): BrowserSttMode => BROWSER_STT_MODE;

// Optional setter for future toggling without code changes
export const setBrowserSttMode = (mode: BrowserSttMode) => {
  BROWSER_STT_MODE = mode;
};
