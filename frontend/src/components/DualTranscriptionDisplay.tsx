import React, { useRef, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TranscriptSegment } from "utils/persistentTranscriptionUtils";
import { Badge } from "@/components/ui/badge";
import { LanguageDetectionIndicator } from "components/LanguageDetectionIndicator";

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
  geminiSegments?: Array<{id: string; text: string; speaker?: string; timestamp: number | string; translation?: string}>; // Add parsed Gemini segments
}

export const DualTranscriptionDisplay: React.FC<Props> = ({
  browserTranscript,
  geminiTranscript,
  isProcessing,
  errorMessage,
  browserSegments,
  interimSegment,
  speakers,
  expandedView = false,
  detectedLanguage = 'en',
  geminiSegments = []
}) => {
  const browserScrollRef = useRef<HTMLDivElement>(null);
  const geminiScrollRef = useRef<HTMLDivElement>(null);
  
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
  
  const formatSegmentText = (text: string): JSX.Element => {
    return <>{text}</>;
  };

  return (
    <div className="space-y-4">
      
      {/* Gemini enhanced transcription */}
      <div className="border rounded-md overflow-hidden shadow-sm" id="transcript-container">
        <div className="bg-purple-50 px-4 py-2.5 border-b border-purple-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Gemini Transcription</Badge>
            <span className="text-sm text-purple-700">Enhanced with speaker identification</span>
            {detectedLanguage && detectedLanguage !== 'en' && (
              <LanguageDetectionIndicator languageCode={detectedLanguage} colorScheme="purple" />
            )}
          </div>
        </div>
        <div 
          ref={geminiScrollRef}
          className={`${expandedView ? 'h-[300px]' : 'h-[200px]'} overflow-y-auto p-4 bg-white relative`}
        >
          {geminiSegments && geminiSegments.length > 0 ? (
            <div className="space-y-4">
              {geminiSegments.map((segment, index) => (
                <div key={segment.id || index} className="p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-semibold text-sm text-purple-700">
                      {segment.speaker || 'Speaker'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {typeof segment.timestamp === 'string' ? segment.timestamp : new Date(segment.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  {/* Original text */}
                  <div className="text-base leading-relaxed mb-2">
                    {segment.text}
                  </div>
                  
                  {/* Translation if available */}
                  {segment.translation && segment.translation !== segment.text && (
                    <div className="mt-3 p-3 bg-purple-50 rounded-md border-l-4 border-purple-400">
                      <div className="text-sm font-medium text-purple-600 mb-1">Translation:</div>
                      <div className="text-base leading-relaxed text-purple-800">
                        {segment.translation}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : geminiTranscript ? (
            <div className="whitespace-pre-line">
              {geminiTranscript.split('\n').map((line, index) => (
                <p key={index} className="mb-2">{line}</p>
              ))}
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
    </div>
  );
};
