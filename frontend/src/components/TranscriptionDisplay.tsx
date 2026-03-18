
import React, { useRef, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSafeModuleContext } from "../utils/ModuleContext";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff } from "lucide-react";
import { TranscriptionSegment } from "../brain/data-contracts";
import { TranslationControls } from "components/TranslationControls";
import { getLanguageName } from "../utils/languageUtils";
// Removed post-processing imports

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
}

export const TranscriptionDisplay: React.FC<Props> = ({
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

  // Simplified parse function with enhanced error message JSON extraction
  const parseTranscript = (text: string): SpeakerSegment[] => {
    if (!text) return [];
    
    // First check if we have a full_text property that contains the error with JSON
    let jsonContent: string | null = null;
    
    try {
      // Try parsing the entire text as JSON first
      const possibleJson = JSON.parse(text);
      if (possibleJson.full_text && typeof possibleJson.full_text === 'string') {
        // Extract the raw JSON from the full_text
        const errorMatch = possibleJson.full_text.match(/Error: Could not parse transcription data\. Raw output: ```json\n([\s\S]+?)\n```$/s);
        if (errorMatch && errorMatch[1]) {
          jsonContent = errorMatch[1].trim();
          console.log("Extracted JSON from full_text", jsonContent.substring(0, 100) + "...");
        }
      }
    } catch (e) {
      // Not a JSON object, continuing to other methods
      console.log("Text is not a JSON object, trying direct extraction");
    }
    
    // If we didn't find JSON in the full_text, try direct extraction
    if (!jsonContent) {
      const directMatch = text.match(/Error: Could not parse transcription data\. Raw output: ```json\n([\s\S]+?)\n```$/s);
      if (directMatch && directMatch[1]) {
        jsonContent = directMatch[1].trim();
        console.log("Directly extracted JSON from text", jsonContent.substring(0, 100) + "...");
      }
    }
    
    // If we found JSON content, try to parse it
    if (jsonContent) {
      try {
        const rawJson = JSON.parse(jsonContent);
        console.log("Successfully parsed extracted JSON");
        
        // If we have properly formatted JSON with segments, use it directly
        if (rawJson.segments && Array.isArray(rawJson.segments)) {
          const mappedSegments = rawJson.segments.map(segment => ({
            speaker: segment.speaker?.name || "Unknown",
            text: segment.text || "",
            timestamp: segment.start_time ? `${Math.floor(segment.start_time / 60)}:${Math.floor(segment.start_time % 60).toString().padStart(2, '0')}` : "",
            language: segment.language || "en"
          }));
          
          // Log each segment's language for debugging
          mappedSegments.forEach((segment, index) => {
            console.log(`Segment ${index}: language=${segment.language}, speaker=${segment.speaker}`);
          });
          
          return mappedSegments;
        }
      } catch (e) {
        console.error("Failed to parse extracted JSON:", e);
      }
    }
    
    // Standard parsing logic if no raw JSON or if JSON parsing failed
    const segments: SpeakerSegment[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    let currentSpeaker = "";
    let currentText = "";
    let currentTimestamp = "";
    let currentLanguage = "en"; // Default to English
    
    for (const line of lines) {
      // Try to extract timestamp if present
      const timestampMatch = line.match(/^\[(\d+:\d+)\]/);
      if (timestampMatch) {
        currentTimestamp = timestampMatch[1];
      }
      
      // Look for language indicators [xx] where xx is a language code
      const languageMatch = line.match(/\[(\w{2})\]/);
      if (languageMatch) {
        currentLanguage = languageMatch[1].toLowerCase();
      }
      
      // Only try to match regular speaker pattern: "Speaker: Text"
      const speakerMatch = line.match(/^([\w\s_]+?):\s*(.*)/i);
      
      if (speakerMatch) {
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
        currentSpeaker = speakerMatch[1].trim();
        currentText = speakerMatch[2];
        // Retain timestamp and language for this segment
      } else if (line.trim() && currentSpeaker) {
        // Continue the current segment
        currentText += "\n" + line;
      } else if (line.trim()) {
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
        // Retain timestamp and language
      }
    }
    
    // Add the last segment if needed
    if (currentSpeaker && currentText.trim()) {
      segments.push({ 
        speaker: currentSpeaker, 
        text: currentText.trim(),
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
      {/* Status indicators removed - handled by TranscriptionStatusIndicator component */}
      
      {/* Transcript display */}
      <div className="relative border rounded-md overflow-hidden shadow-sm">
        {speakerSegments.length > 0 || interimText ? (
          <div 
            ref={scrollAreaRef}
            className={`${speakerSegments.length > 0 || interimText ? (expandedView ? 'min-h-[1100px] sm:min-h-[1250px] h-[calc(100vh-200px)]' : 'min-h-[850px] sm:min-h-[1000px] h-[calc(100vh-250px)]') : 'min-h-[300px] sm:min-h-[350px]'} overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 bg-white transition-all duration-300 ease-in-out`}
          >
            {speakerSegments.map((segment, index) => {
              // Apply speaker name mapping
              const displayName = mapSpeakerName(segment.speaker);
              const isLiveSegment = segment.speaker.includes('(LIVE)');
              const colorClass = getSpeakerColor(displayName, isLiveSegment);
              
              // Display text without any formatting or highlighting
              const formattedText = segment.text;

              return (
                <div key={index} className={`p-6 sm:p-7 rounded-lg border ${colorClass} mb-4`}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="font-semibold text-lg sm:text-xl flex flex-wrap items-center gap-2">
                      <span>
                        {displayName.replace(' (LIVE)', '').replace(' (BROWSER)', '')}
                      </span>
                      {isLiveSegment && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Live
                        </span>
                      )}
                      {segment.speaker.includes('(BROWSER)') && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Browser
                        </span>
                      )}
                      {segment.language && segment.language !== "en" && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m5 8 6 6"/>
                            <path d="m4 14 6-6 2-3"/>
                            <path d="M2 5h12"/>
                            <path d="M7 2h1"/>
                            <path d="m22 22-5-10-5 10"/>
                            <path d="M14 18h6"/>
                          </svg>
                          {getLanguageName(segment.language)}
                        </span>
                      )}
                    </div>
                    {segment.timestamp && showTimestamps && (
                      <div className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {segment.timestamp}
                      </div>
                    )}
                  </div>
                  
                  {/* Non-English content gets a special background */}
                  <div className={`${segment.language && segment.language !== "en" ? 'bg-yellow-50 p-3 rounded-md border-l-4 border-yellow-200' : ''}`}>
                    <div className={`whitespace-pre-wrap text-base sm:text-lg leading-relaxed font-medium ${segment.speaker.includes('(BROWSER)') || segment.speaker.includes('(LIVE)') ? 'text-blue-600' : 'text-gray-900'}`}>
                      {segment.text}
                    </div>
                  </div>
                  
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
      

      {errorMessage && (
        <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm sm:text-base">
          {errorMessage}
        </div>
      )}
      

    </div>
  );
};
