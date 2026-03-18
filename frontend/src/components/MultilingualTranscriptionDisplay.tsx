
import React, { useRef, useEffect, useState } from "react";
import { useSafeModuleContext } from "../utils/ModuleContext";
import { Badge } from "@/components/ui/badge";
import { TranscriptionSegment as ApiTranscriptionSegment } from "../brain/data-contracts";
import { TranslationControls } from "components/TranslationControls";

interface Props {
  transcript: string;
  isProcessing: boolean;
  errorMessage: string | null;
  onTranscriptChange: (text: string) => void;
  speakers?: string[];
  interimText?: string;
  transcriptionMode?: 'browser' | 'gemini' | 'hybrid';
  isOffline?: boolean;
  highlightCorrections?: boolean;
  expandedView?: boolean;
}

interface SpeakerSegment {
  speaker: string;
  text: string;
  timestamp?: string;
  language?: string;
  translation?: string; // Add translation field
}

// Language name mapping helper
const getLanguageName = (code: string): string => {
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

// Direction control for RTL languages
const getTextDirection = (languageCode?: string): "rtl" | "ltr" => {
  const rtlLanguages = ["ar", "he", "ur", "fa", "ps", "sd"];
  return languageCode && rtlLanguages.includes(languageCode) ? "rtl" : "ltr";
};

export const MultilingualTranscriptionDisplay: React.FC<Props> = ({
  transcript,
  isProcessing,
  errorMessage,
  onTranscriptChange,
  speakers = [],
  interimText = "",
  transcriptionMode = 'browser',
  isOffline = false,
  highlightCorrections = false,
  expandedView = false,
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { hasModuleAccess } = useSafeModuleContext();
  
  // Track if user is manually scrolling
  const [userScrolled, setUserScrolled] = useState(false);
  
  // Set default module access
  const showTimestamps = hasModuleAccess('recording') || true; // Fallback to true 
  const allowFormatting = hasModuleAccess('persistence') || false; // Fallback to false

  // Handle scroll events to detect manual scrolling
  const handleScroll = () => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      // If we're not at the bottom, user has scrolled up
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 30; // 30px threshold
      setUserScrolled(!isAtBottom);
    }
  };
  
  // Add scroll event listener
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Auto-scroll to the bottom when transcript updates or interim text changes,
  // but only if the user hasn't manually scrolled up
  useEffect(() => {
    if (scrollAreaRef.current && !userScrolled) {
      const scrollContainer = scrollAreaRef.current;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [transcript, interimText, userScrolled]);
  
  // Reset userScrolled when recording is paused or stopped
  useEffect(() => {
    if (!interimText) {
      setUserScrolled(false);
    }
  }, [interimText]);

  // Map generic speaker names to actual names if available
  const mapSpeakerName = (genericName: string): string => {
    // Extract just the speaker number if it matches pattern "Speaker X"
    const match = genericName.match(/^Speaker\s+(\d+)$/i);
    if (match && match[1]) {
      const speakerIndex = parseInt(match[1], 10) - 1;
      if (speakerIndex >= 0 && speakerIndex < speakers.length) {
        return speakers[speakerIndex];
      }
    }
    return genericName;
  };

  
  // Enhanced parse function with language detection
  const parseTranscript = (text: string): SpeakerSegment[] => {
    if (!text) return [];
    
    // Check if the text contains error message with raw JSON
    const errorJsonMatch = text.match(/Error: Could not parse transcription data\. Raw output: ```json\n(.+?)\n```$/s);
    if (errorJsonMatch && errorJsonMatch[1]) {
      try {
        // Extract and parse the raw JSON
        const rawJson = JSON.parse(errorJsonMatch[1]);
        const segments: SpeakerSegment[] = [];
        
        // If we have properly formatted JSON with segments, use it directly
        if (rawJson.segments && Array.isArray(rawJson.segments)) {
          return rawJson.segments.map(segment => ({
            speaker: segment.speaker?.name || "Unknown",
            text: segment.text || "",
            timestamp: segment.start_time ? `${Math.floor(segment.start_time / 60)}:${Math.floor(segment.start_time % 60).toString().padStart(2, '0')}` : "",
            language: segment.language || "en"
          }));
        }
      } catch (e) {
        console.error("Failed to parse JSON from error message:", e);
      }
    }

    const lines = text.split('\n');
    const segments: SpeakerSegment[] = [];
    let currentSpeaker = "";
    let currentText = "";
    let currentTimestamp = "";
    let currentLanguage = "en";
    let currentOriginal = "";
    let currentTranslation = "";
    let inTranslationBlock = false;

    for (const line of lines) {
      // Detect language markers
      const languageMatch = line.match(/\[(\w{2})\]/);
      if (languageMatch) {
        currentLanguage = languageMatch[1].toLowerCase();
      }
      
      // Check for new SPEAKER/ORIGINAL/TRANSLATION format
      const speakerMatch = line.match(/^SPEAKER:\s*(.+)$/);
      const originalMatch = line.match(/^ORIGINAL:\s*(.+)$/);
      const translationMatch = line.match(/^TRANSLATION:\s*(.+)$/);
      
      if (speakerMatch) {
        // If we already have a complete segment, save it
        if (currentSpeaker && (currentText.trim() || currentOriginal.trim())) {
          segments.push({
            speaker: currentSpeaker,
            text: currentOriginal || currentText,
            translation: currentTranslation,
            timestamp: currentTimestamp,
            language: currentLanguage
          });
        }
        
        // Start new translation block
        currentSpeaker = speakerMatch[1].trim();
        currentOriginal = "";
        currentTranslation = "";
        currentText = "";
        inTranslationBlock = true;
      } else if (originalMatch && inTranslationBlock) {
        currentOriginal = originalMatch[1].trim();
      } else if (translationMatch && inTranslationBlock) {
        currentTranslation = translationMatch[1].trim();
        // End of translation block - create segment
        if (currentSpeaker && currentOriginal) {
          segments.push({
            speaker: currentSpeaker,
            text: currentOriginal,
            translation: currentTranslation,
            timestamp: currentTimestamp,
            language: currentLanguage
          });
        }
        
        // Reset for next block
        currentSpeaker = "";
        currentOriginal = "";
        currentTranslation = "";
        currentText = "";
        inTranslationBlock = false;
      } else {
        // Fallback to original parsing logic for regular speaker format
        const regularSpeakerMatch = line.match(/^(?:\[\d+:\d+\]\s*)?(.*?):\s*(.*)/);
        
        if (regularSpeakerMatch) {
          // If we already have content, save the previous segment
          if (currentSpeaker && currentText.trim()) {
            segments.push({
              speaker: currentSpeaker,
              text: currentText.trim(),
              timestamp: currentTimestamp,
              language: currentLanguage
            });
          }
          
          // Start new segment
          currentSpeaker = regularSpeakerMatch[1].trim();
          currentText = regularSpeakerMatch[2];
          inTranslationBlock = false;
        } else if (line.trim() && currentSpeaker && !inTranslationBlock) {
          // Continue the current segment
          currentText += "\n" + line;
        } else if (line.trim() && !inTranslationBlock) {
          // No speaker identified, but we have content
          if (currentSpeaker) {
            segments.push({
              speaker: currentSpeaker,
              text: currentText.trim(),
              timestamp: currentTimestamp,
              language: currentLanguage
            });
          }
          currentSpeaker = "Unknown";
          currentText = line;
        }
      }
    }
    
    // Add the last segment if needed
    if (currentSpeaker && (currentText.trim() || currentOriginal.trim())) {
      segments.push({
        speaker: currentSpeaker,
        text: currentOriginal || currentText,
        translation: currentTranslation,
        timestamp: currentTimestamp,
        language: currentLanguage
      });
    }
    
    return segments;
  };
  
  const speakerSegments = parseTranscript(transcript);
  
  // Generate a consistent color for each speaker
  const getSpeakerColor = (speaker: string, isLive: boolean = false) => {
    // Simple hash function to generate a consistent number from a string
    const hash = speaker.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    // Use the hash to select from a set of pleasing colors
    const colors = [
      'bg-blue-50 border-blue-200 text-blue-800',
      'bg-green-50 border-green-200 text-green-800',
      'bg-purple-50 border-purple-200 text-purple-800',
      'bg-amber-50 border-amber-200 text-amber-800',
      'bg-rose-50 border-rose-200 text-rose-800',
      'bg-cyan-50 border-cyan-200 text-cyan-800',
    ];
    
    // For live segments, use a pulsing effect
    if (isLive) {
      return 'bg-blue-50 border-blue-300 border-2 text-blue-800';
    }
    
    return colors[hash % colors.length];
  };

  return (
    <div className="space-y-3">
      {/* Transcript display */}
      <div className="relative border rounded-md overflow-hidden shadow-sm">
        {speakerSegments.length > 0 || interimText ? (
          <div 
            ref={scrollAreaRef}
            className={`${speakerSegments.length > 0 || interimText ? (expandedView ? 'min-h-[900px] sm:min-h-[1050px] h-[calc(100vh-250px)]' : 'min-h-[675px] sm:min-h-[825px] h-[calc(100vh-300px)]') : 'min-h-[225px] sm:min-h-[270px]'} overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 bg-white transition-all duration-300 ease-in-out`}
          >
            {speakerSegments.map((segment, index) => {
              // Apply speaker name mapping
              const displayName = mapSpeakerName(segment.speaker);
              const isLiveSegment = segment.speaker.includes('(LIVE)');
              const colorClass = getSpeakerColor(displayName, isLiveSegment);
              const textDirection = getTextDirection(segment.language);
              
              return (
                <div key={index} className={`p-3 sm:p-4 rounded-lg border ${colorClass}`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="font-semibold text-base sm:text-lg">
                      {displayName.replace(' (LIVE)', '').replace(' (BROWSER)', '')}
                      {isLiveSegment && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Live
                        </span>
                      )}
                      {segment.speaker.includes('(BROWSER)') && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Browser
                        </span>
                      )}
                      {segment.language && (
                        <span className="ml-2 text-xs bg-primary/20 rounded-full px-2 py-0.5">
                          {getLanguageName(segment.language)}
                        </span>
                      )}
                    </div>
                    {segment.timestamp && showTimestamps && (
                      <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {segment.timestamp}
                      </div>
                    )}
                  </div>
                  
                  {/* Original text */}
                  <div 
                    className={`whitespace-pre-wrap text-base leading-relaxed`}
                    style={{ direction: textDirection }}
                  >
                    {segment.text}
                  </div>
                  
                  {/* Translation if available */}
                  {segment.translation && segment.translation !== segment.text && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md border-l-4 border-blue-400">
                      <div className="text-sm font-medium text-gray-600 mb-1">Translation:</div>
                      <div className="text-base leading-relaxed text-gray-800">
                        {segment.translation}
                      </div>
                    </div>
                  )}
                  
                  {/* Translation controls - only for non-English segments */}
                  <TranslationControls 
                    text={segment.text}
                    sourceLanguage={segment.language}
                    colorScheme={colorClass.includes('blue') ? 'blue' : 
                               colorClass.includes('green') ? 'green' : 
                               colorClass.includes('purple') ? 'purple' : 
                               colorClass.includes('amber') ? 'amber' : 
                               colorClass.includes('rose') ? 'rose' : ''}
                  />
                  
                  {allowFormatting && (
                    <div className="mt-3 flex gap-2 justify-end">
                      <button className="text-xs text-gray-500 hover:text-gray-700 p-1">
                        Edit
                      </button>
                      <button className="text-xs text-gray-500 hover:text-gray-700 p-1">
                        Format
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Show interim text if available */}
            {interimText && (
              <div className="p-4 sm:p-5 rounded-lg border border-dashed border-blue-300 bg-blue-50">
                <div className="font-semibold text-lg sm:text-xl flex items-center gap-2">
                  <div>Current Speaker</div>
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </div>
                </div>
                <div className="whitespace-pre-wrap text-lg leading-relaxed text-blue-600 mt-2">{interimText}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="min-h-[450px] sm:min-h-[500px] p-6 sm:p-8 flex items-center justify-center text-gray-400 italic text-lg">
            Start recording to see transcript here...
          </div>
        )}
        
        {/* Hidden textarea for editing if needed */}
        <textarea 
          value={transcript} 
          onChange={(e) => onTranscriptChange(e.target.value)}
          className="hidden"
        />
        
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="text-center p-4 sm:p-6">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]"></div>
              <p className="mt-3 text-base font-medium text-gray-700">Processing with Gemini AI...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Small color indicator */}
      <div className="text-xs text-gray-500 mt-1 flex items-center justify-end gap-3">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <span>Browser</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-900"></div>
          <span>Gemini</span>
        </div>
      </div>
      {errorMessage && (
        <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm sm:text-base">
          {errorMessage}
        </div>
      )}
      
      {/* Instructions */}
      {!transcript && (
        <div className="text-sm sm:text-base text-gray-500 mt-4">
          <p className="font-medium mb-2">Instructions:</p>
          <ol className="list-decimal pl-5 sm:pl-6 space-y-2">
            <li>Click "Start Recording" to begin capturing audio</li>
            <li>Speak clearly into your microphone</li>
            <li>You'll see real-time transcription as you speak</li>
            <li>Text appears in <span className="text-blue-600">blue</span> from browser initially, changes to <span className="text-gray-900 font-medium">black</span> after Gemini processes it</li>
            <li>Gemini actively identifies speakers and languages in real-time as you record</li>
            <li>Non-English text will show a language indicator</li>
            <li>You can translate non-English segments to English by clicking "Translate to English"</li>
            <li>Right-to-left languages (Arabic, Hebrew, etc.) will display properly</li>
          </ol>
        </div>
      )}
    </div>
  );
};
