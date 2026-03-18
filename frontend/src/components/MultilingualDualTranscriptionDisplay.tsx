import React, { useRef, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TranscriptSegment } from "utils/persistentTranscriptionUtils";
import { Badge } from "@/components/ui/badge";
import { LanguageDetectionIndicator } from "components/LanguageDetectionIndicator";
import { getLanguageName } from "components/LanguageDetectionIndicator";
import { TranslationButton } from "components/TranslationButton";

interface Props {
  browserTranscript: string;
  geminiTranscript: string;
  isProcessing: boolean;
  errorMessage: string | null;
  browserSegments: TranscriptSegment[];
  interimSegment: TranscriptSegment | null;
  speakers: string[];
  expandedView?: boolean;
  detectedLanguage?: string;
}

// Helper function to determine if text is RTL
const getTextDirection = (languageCode?: string): "rtl" | "ltr" => {
  const rtlLanguages = ["ar", "he", "ur", "fa", "ps", "sd"];
  return languageCode && rtlLanguages.includes(languageCode) ? "rtl" : "ltr";
};

export const MultilingualDualTranscriptionDisplay: React.FC<Props> = ({
  browserTranscript,
  geminiTranscript,
  isProcessing,
  errorMessage,
  browserSegments,
  interimSegment,
  speakers,
  expandedView = false,
  detectedLanguage: initialDetectedLanguage = 'en'
}) => {
  const browserScrollRef = useRef<HTMLDivElement>(null);
  const geminiScrollRef = useRef<HTMLDivElement>(null);
  const [detectedLanguage, setDetectedLanguage] = useState(initialDetectedLanguage);
  
  // Auto-scroll to the bottom when transcripts update
  useEffect(() => {
    if (browserScrollRef.current) {
      browserScrollRef.current.scrollTop = browserScrollRef.current.scrollHeight;
    }
  }, [browserTranscript, interimSegment]);
  
  useEffect(() => {
    if (geminiScrollRef.current) {
      geminiScrollRef.current.scrollTop = geminiScrollRef.current.scrollHeight;
    }
  }, [geminiTranscript]);
  
  // Parse language and segments from the Gemini transcript JSON format
  const [parsedTranscript, setParsedTranscript] = useState<{
    segments: Array<{
      speaker: { id: string, name: string };
      text: string;
      language: string;
      needs_translation?: boolean;
    }>;
    languages_detected: string[];
  } | null>(null);
  
  // Try to extract JSON from Gemini transcript if available
  useEffect(() => {
    if (!geminiTranscript) {
      setParsedTranscript(null);
      return;
    }
    
    try {
      // First, try to directly extract languages detected from the text for our indicator
      const languagePatterns = [
        // Looking for language codes in various formats
        /language:\s*([a-z]{2})/i,
        /language code:\s*([a-z]{2})/i,
        /\[(language|lang):\s*([a-z]{2})\]/i,
        /\[([a-z]{2})\]/i,
        // Spanish detection
        /\b(español|spanish)\b/i
      ];
      
      // Check for language indicators in the transcript text
      for (const pattern of languagePatterns) {
        const match = geminiTranscript.match(pattern);
        if (match) {
          const detectedCode = pattern.toString().includes('spanish') ? 'es' : 
                             (match[2] || match[1]).toLowerCase();
          
          if (detectedCode && detectedCode !== 'en') {
            console.log(`Language detected in transcript: ${detectedCode}`);
            setDetectedLanguage(detectedCode);
            break;
          }
        }
      }
      
      // Special case for Spanish text without explicit markers
      if (detectedLanguage === 'en' && /[áéíóúñ¿¡]|\b(ser|hablar|quería|seguir|estudiando)\b/i.test(geminiTranscript)) {
        console.log("Spanish text detected by character/word analysis");
        setDetectedLanguage('es');
      }
      
      // Try multiple JSON extraction approaches
      let foundJson = null;
      
      // Approach 1: Direct JSON extraction with various starting patterns
      const jsonPatterns = [
        /\{\s*"segments"[\s\S]*?\}/,
        /\{\s*"speakers"[\s\S]*?\}/,
        /\{\s*"languages_detected"[\s\S]*?\}/
      ];
      
      for (const pattern of jsonPatterns) {
        const match = geminiTranscript.match(pattern);
        if (match) {
          try {
            const possibleJson = JSON.parse(match[0]);
            if (possibleJson.segments && Array.isArray(possibleJson.segments)) {
              foundJson = possibleJson;
              console.log("Found valid JSON structure in transcript");
              break;
            }
          } catch (e) {
            console.log("Failed to parse potential JSON match");
          }
        }
      }
      
      // If we found valid JSON, use it
      if (foundJson) {
        // Update our parsedTranscript state with the extracted JSON
        setParsedTranscript(foundJson);
        
        // Set the global detected language based on languages_detected array
        if (foundJson.languages_detected && foundJson.languages_detected.length > 0) {
          // Find first non-English language, or use the first language
          const nonEnglish = foundJson.languages_detected.find(lang => lang !== 'en');
          if (nonEnglish) {
            setDetectedLanguage(nonEnglish);
          } else {
            setDetectedLanguage(foundJson.languages_detected[0]);
          }
        }
        return;
      }
      
      // If no JSON found, create a structured representation based on text content
      // Fallback for the specific case in the user's screenshot
      if (detectedLanguage !== 'en' && geminiTranscript.includes('Speaker')) {
        console.log("Creating manual structured transcript for non-English content");
        // Extract speaker sections
        const speakerSections = geminiTranscript.split(/\r?\n\r?\n/);
        const segments = [];
        
        for (let i = 0; i < speakerSections.length; i++) {
          const section = speakerSections[i].trim();
          if (!section) continue;
          
          // Try to extract speaker name
          const speakerMatch = section.match(/^(Speaker \d+|[A-Za-z]+ \d*):\s*(.+)$/s);
          if (speakerMatch) {
            segments.push({
              speaker: { 
                id: `speaker_${i+1}`, 
                name: speakerMatch[1].trim() 
              },
              text: speakerMatch[2].trim(),
              language: detectedLanguage
            });
          } else if (section.includes(':')) {
            // Simpler fallback
            const parts = section.split(':', 2);
            segments.push({
              speaker: { 
                id: `speaker_${i+1}`, 
                name: parts[0].trim() 
              },
              text: parts[1].trim(),
              language: detectedLanguage
            });
          }
        }
        
        if (segments.length > 0) {
          setParsedTranscript({
            segments,
            languages_detected: [detectedLanguage]
          });
          return;
        }
      }
      
      // Last resort: If we detected a non-English language but couldn't parse structure,
      // create a simple one-segment transcript
      if (detectedLanguage !== 'en') {
        setParsedTranscript({
          segments: [{
            speaker: { id: "speaker_1", name: "Speaker" },
            text: geminiTranscript.trim(),
            language: detectedLanguage
          }],
          languages_detected: [detectedLanguage]
        });
      } else {
        setParsedTranscript(null);
      }
    } catch (e) {
      console.error("Failed to parse transcript:", e);
      setParsedTranscript(null);
    }
  }, [geminiTranscript, detectedLanguage, initialDetectedLanguage]);
  
  // Fallback: Parse language indication from gemini transcript text format
  const parseLanguageFromGemini = (text: string): Record<string, string> => {
    const languageMap: Record<string, string> = {};
    
    // Look for language markers in format: [Speaker Name, xx] where xx is language code
    const languageRegex = /\[(.*?),\s*([a-z]{2})\]/gi;
    let match;
    
    while ((match = languageRegex.exec(text)) !== null) {
      const speaker = match[1].trim();
      const language = match[2].toLowerCase();
      languageMap[speaker] = language;
    }
    
    return languageMap;
  };
  
  // Extract language tags from Gemini transcript (fallback)
  const speakerLanguages = parseLanguageFromGemini(geminiTranscript);
  
  // Track translated segments
  const [translatedSegments, setTranslatedSegments] = useState<Record<string, string>>({});
  
  // Format segment text with language consideration
  const formatSegmentText = (text: string, languageCode?: string): JSX.Element => {
    const direction = getTextDirection(languageCode);
    return <div style={{ direction }}>{text}</div>;
  };

  return (
    <div className="space-y-4">
      
      {/* Browser real-time transcription */}
      <div className="border rounded-md overflow-hidden shadow-sm" id="transcript-container">
        <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="default">Browser Transcription</Badge>
            <span className="text-sm text-blue-700">Real-time without speaker identification</span>
            {detectedLanguage && detectedLanguage !== 'en' && (
              <LanguageDetectionIndicator languageCode={detectedLanguage} colorScheme="blue" />
            )}
          </div>
        </div>
        <div 
          ref={browserScrollRef}
          className={`${expandedView ? 'h-[300px]' : 'h-[200px]'} overflow-y-auto p-4 bg-white`}
        >
          {browserSegments.length > 0 || interimSegment ? (
            <div className="space-y-3">
              {/* Render all final segments */}
              {browserSegments.map((segment, index) => {
                // Check if we have a language code for this speaker
                const speakerLanguage = speakerLanguages[segment.speakerName] || detectedLanguage;
                const textDirection = getTextDirection(speakerLanguage);
                
                return (
                  <div key={segment.segmentId} className="p-3 rounded-lg border border-blue-200 bg-blue-50">
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="font-medium text-blue-800 flex items-center gap-2">
                        {segment.speakerName}
                        {speakerLanguage && speakerLanguage !== "en" && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            {getLanguageName(speakerLanguage)}
                          </span>
                        )}
                      </div>
                      {segment.timestamp > 0 && (
                        <div className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                          {Math.floor(segment.timestamp / 60).toString().padStart(2, '0')}:
                          {Math.floor(segment.timestamp % 60).toString().padStart(2, '0')}
                        </div>
                      )}
                    </div>
                    <div className="text-blue-800" style={{ direction: textDirection }}>
                      {segment.text}
                    </div>
                  </div>
                );
              })}
              
              {/* Render interim segment if available */}
              {interimSegment && (
                <div className="p-3 rounded-lg border border-dashed border-blue-300 bg-blue-50">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="font-medium text-blue-800">
                      {interimSegment.speakerName}
                    </div>
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </div>
                  </div>
                  <div className="text-blue-800 italic">
                    {formatSegmentText(interimSegment.text, detectedLanguage)}
                  </div>
                </div>
              )}
              
              {/* Special mobile interim transcription container */}
              <div id="interim-transcript" className="p-3 mt-2 text-sm font-medium text-gray-500 italic" style={{display: 'none'}}></div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 italic">
              Start recording to see browser transcription here...
            </div>
          )}
        </div>
      </div>
      
      {/* Gemini enhanced transcription */}
      <div className="border rounded-md overflow-hidden shadow-sm" id="transcript-container">
        <div className="bg-purple-50 px-4 py-2.5 border-b border-purple-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Gemini Transcription</Badge>
            <span className="text-sm text-purple-700">Enhanced with speaker and language identification</span>
            {detectedLanguage && detectedLanguage !== 'en' && (
              <LanguageDetectionIndicator languageCode={detectedLanguage} colorScheme="purple" />
            )}
          </div>
        </div>
        <div 
          ref={geminiScrollRef}
          className={`${expandedView ? 'h-[300px]' : 'h-[200px]'} overflow-y-auto p-4 bg-white relative`}
        >
          {geminiTranscript ? (
            <div className="whitespace-pre-line">
              {/* Display structured JSON if available */}
              {parsedTranscript ? (
                <div className="space-y-4">
                  {parsedTranscript.segments.map((segment, index) => {
                    const segmentId = `segment-${index}`;
                    const languageCode = segment.language;
                    const textDirection = getTextDirection(languageCode);
                    // This variable is no longer needed as we're showing translation buttons for all segments
                    // const isNonEnglish = languageCode && languageCode !== 'en';
                    const isTranslated = translatedSegments[segmentId];
                    
                    return (
                      <div key={segmentId} className="p-3 rounded-lg border border-purple-200 bg-purple-50">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-purple-800">{segment.speaker.name}</span>
                            {languageCode && languageCode !== "en" && (
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                                {getLanguageName(languageCode)}
                              </span>
                            )}
                          </div>
                          
                          {/* Translation button for all content */}
                          <TranslationButton
                            originalText={segment.text}
                            sourceLanguage={languageCode || 'en'}
                            targetLanguage="en"
                            size="sm"
                            variant="ghost"
                            className="text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                            onTranslated={(translatedText) => {
                              setTranslatedSegments(prev => ({
                                ...prev,
                                [segmentId]: translatedText
                              }));
                            }}
                          />
                        </div>
                        
                        {/* Original text */}
                        <p className="mb-2" style={{ direction: textDirection }}>
                          {segment.text}
                        </p>
                        
                        {/* Translated text if available */}
                        {isTranslated && (
                          <div className="mt-2 pt-2 border-t border-purple-200">
                            <p className="text-sm text-purple-800 italic">
                              {translatedSegments[segmentId]}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Language summary */}
                  {parsedTranscript.languages_detected.length > 1 && (
                    <div className="mt-4 pt-2 border-t border-purple-100 text-sm text-purple-700">
                      <span className="font-medium">Languages detected: </span>
                      {parsedTranscript.languages_detected.map(lang => getLanguageName(lang)).join(', ')}
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback to text-based parsing if no JSON structure */
                <div className="whitespace-pre-line">
                  {/* Process and display the transcript with language indications */}
                  {geminiTranscript.split('\n').map((line, index) => {
                    // Extract language from line if present
                    const languageMatch = line.match(/\[(.*?),\s*([a-z]{2})\]/);
                    const languageCode = languageMatch ? languageMatch[2] : detectedLanguage;
                    const textDirection = getTextDirection(languageCode);
                    
                    // Format the line by removing language tags for display
                    let displayLine = line.replace(/\[(.*?),\s*([a-z]{2})\]/g, '[$1]');
                    
                    // Check if line starts with a speaker
                    const speakerMatch = displayLine.match(/^([^:]+):/);
                    const segmentId = `text-segment-${index}`;
                    const needsTranslation = languageCode !== 'en';
                    const isTranslated = translatedSegments[segmentId];
                    
                    if (speakerMatch && languageCode && languageCode !== 'en') {
                      // If we have a speaker and non-English language, enhance display
                      const speakerText = displayLine.replace(/^[^:]+:\s*/, '');
                      
                      return (
                        <div key={segmentId} className="mb-3 p-3 rounded-lg border border-purple-200 bg-purple-50">
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-purple-800">{speakerMatch[1]}</span>
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                                {getLanguageName(languageCode)}
                              </span>
                            </div>
                            
                            {/* Translation button for all content */}
                            <TranslationButton
                              originalText={speakerText}
                              sourceLanguage={languageCode || 'en'}
                              targetLanguage="en"
                              size="sm"
                              variant="ghost"
                              className="text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                              onTranslated={(translatedText) => {
                                setTranslatedSegments(prev => ({
                                  ...prev,
                                  [segmentId]: translatedText
                                }));
                              }}
                            />
                          </div>
                          
                          {/* Original text */}
                          <p className="mb-2" style={{ direction: textDirection }}>
                            {speakerText}
                          </p>
                          
                          {/* Translated text if available */}
                          {isTranslated && (
                            <div className="mt-2 pt-2 border-t border-purple-200">
                              <p className="text-sm text-purple-800 italic">
                                {translatedSegments[segmentId]}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    // Default display for regular lines
                    return (
                      <p key={index} className="mb-2" style={{ direction: textDirection }}>
                        {displayLine}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 italic">
              Pause or stop recording to see Gemini's enhanced transcription...
            </div>
          )}
          
          {isProcessing && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
                <p className="mt-2 text-sm font-medium text-gray-700">Processing with Gemini...</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {errorMessage}
        </div>
      )}
      
      {/* Info about language display */}
      <div className="text-xs text-gray-500 flex items-center justify-end gap-3">
        <div className="flex items-center gap-1">
          <span>Language indicators show when non-English is detected</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Right-to-left languages are properly displayed</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Click the translate button to translate any segment</span>
        </div>
      </div>
    </div>
  );
};
