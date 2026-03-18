import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mic } from 'lucide-react';
import { TranslationControls } from 'components/TranslationControls';
import { cn } from '@/lib/utils';
import { TranscriptSegment } from 'utils/persistentTranscriptionUtils';
import { InlineSpeakerEditor } from './InlineSpeakerEditor';
import { AudioSourceType } from 'utils/recording/audioSourceTypes';
import { getBrowserSttMode } from 'utils/recording/browserSttConfig';
import { setInterimTextCallback, setInterimFinalizeCallback, setInterimClearCallback } from 'utils/recording/speechRecognitionUtils';

interface Props {
  segments: TranscriptSegment[];
  interimSegment: TranscriptSegment | null;
  isRecording: boolean;
  isProcessing?: boolean;
  className?: string;
  audioSource?: AudioSourceType;
}

/**
 * Dedicated display component for browser native speech-to-text results
 * Shows real-time interim results and final speech segments with speaker identification
 */
export const BrowserSpeechDisplay: React.FC<Props> = ({
  segments,
  interimSegment,
  isRecording,
  isProcessing = false,
  className = '',
  audioSource = AudioSourceType.MICROPHONE
}) => {
  // Local ultra-responsive interim state (V2-style) when in pure mode
  const [interimText, setInterimText] = useState<string>('');
  const browserMode = getBrowserSttMode();

  // Create consistent speaker colors
  const getSpeakerColor = (speaker: string | undefined) => {
    if (!speaker) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    const colors = [
      'bg-emerald-100 text-emerald-800 border-emerald-200',
      'bg-cyan-100 text-cyan-800 border-cyan-200', 
      'bg-violet-100 text-violet-800 border-violet-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-pink-100 text-pink-800 border-pink-200',
    ];
    
    // Extract number from speaker (e.g., "Speaker 1" -> 1)
    const speakerNum = parseInt(speaker.replace(/\D/g, '') || '1') - 1;
    return colors[speakerNum % colors.length];
  };
  
  const getSpeakerColorScheme = (speaker: string | undefined) => {
    if (!speaker) return 'gray';
    
    const schemes = ['emerald', 'cyan', 'violet', 'orange', 'pink'];
    const speakerNum = parseInt(speaker.replace(/\D/g, '') || '1') - 1;
    return schemes[speakerNum % schemes.length];
  };
  
  const formatSpeakerName = (speaker: string | undefined) => {
    if (speaker && speaker !== 'Speaker') {
      return speaker;
    }
    
    // Default fallback
    return speaker || 'Speaker 1';
  };
  
  // Filter final segments only for display
  const finalSegments = segments.filter(segment => segment.isFinal);
  
  // Auto-scroll ref for keeping latest content visible
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new segments are added
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [finalSegments.length, interimSegment, interimText]);

  // Subscribe to Web Speech interim/final callbacks only in pure mode
  useEffect(() => {
    if (browserMode !== 'pure') return;

    // Register callbacks for ultra-responsive updates
    setInterimTextCallback((text: string) => {
      setInterimText(text); // no debounce, immediate paint
    });
    setInterimFinalizeCallback(() => {
      // On finalize, keep UI snappy by clearing interim line
      setInterimText('');
    });
    setInterimClearCallback(() => {
      setInterimText('');
    });

    // Cleanup on unmount
    return () => {
      setInterimTextCallback(null);
      setInterimFinalizeCallback(null);
      setInterimClearCallback(null);
    };
  }, [browserMode]);
  
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
          <Mic className="w-3 h-3 mr-1" />
          Browser Speech
        </Badge>
        
        {isRecording && audioSource !== AudioSourceType.SYSTEM_AUDIO && (
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-emerald-700 font-medium">Listening</span>
          </div>
        )}
        
        {isProcessing && (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
            <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
            <span className="text-xs text-blue-700 font-medium">Processing</span>
          </div>
        )}
      </div>
      
      {/* Scrollable Content Container */}
      <div 
        ref={scrollContainerRef}
        className="max-h-[400px] overflow-y-auto space-y-3 pr-2 scroll-smooth"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* System Audio Mode - Always show this message and hide all transcription */}
        {audioSource === AudioSourceType.SYSTEM_AUDIO ? (
          <div className="min-h-[200px] flex items-center justify-center text-center p-8 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50/30">
            <div>
              <Mic className="w-10 h-10 text-blue-500 mx-auto mb-4" />
              <p className="text-blue-700 font-semibold text-lg mb-3">
                System Audio Mode Active
              </p>
              <p className="text-sm text-gray-700 max-w-md mb-2">
                Browser speech recognition doesn't work with system audio.
              </p>
              <p className="text-sm text-gray-700 max-w-md mb-4">
                <strong>No worries!</strong> Your meeting audio is being recorded and will be transcribed with full speaker identification when you finish.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 border border-emerald-300 rounded-lg">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm text-emerald-700 font-medium">Recording in progress</span>
              </div>
              <p className="text-xs text-blue-600 mt-4">
                💡 Tip: Switch to Microphone mode if you want real-time browser transcription
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Empty State - Only for Microphone mode */}
            {finalSegments.length === 0 && !(browserMode === 'pure' ? interimText : interimSegment) && (
              <div className="min-h-[200px] flex items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 rounded-lg">
                <div>
                  <Mic className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {isRecording ? "Listening for speech..." : "Browser speech recognition ready"}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Real-time transcription with speaker identification
                  </p>
                </div>
              </div>
            )}
            
            {/* Final Segments */}
            {finalSegments.map((segment) => {
              const speakerName = formatSpeakerName(segment.speaker);
              const colorClass = getSpeakerColor(segment.speaker);
              const colorScheme = getSpeakerColorScheme(segment.speaker);
              
              // Safe border class generation
              const borderClass = colorClass ? colorClass.replace('border-', 'border-l-') : 'border-l-gray-200';
              
              return (
                <div
                  key={segment.segmentId}
                  className={cn(
                    'p-4 rounded-lg border-l-4 transition-all duration-300',
                    borderClass
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <Badge 
                      variant="outline" 
                      className={cn('text-xs font-medium', colorClass)}
                    >
                      {speakerName}
                    </Badge>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700">
                        Browser
                      </Badge>
                      <Badge variant="outline" className="text-xs font-mono text-gray-600">
                        {Math.floor(segment.timestamp)}s
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-base leading-relaxed text-gray-900 mb-3">
                    {segment.text}
                  </div>
                  
                  {/* Translation controls */}
                  <TranslationControls
                    text={segment.text}
                    sourceLanguage="auto"
                    colorScheme={colorScheme}
                  />
                </div>
              );
            })}
            
            {/* Interim Segment (Real-time) - Always at bottom. In pure mode, prefer local interim text */}
            {browserMode === 'pure' ? (
              interimText && (
                <div className="p-4 rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50/50 transition-all duration-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-800">
                        Speaker
                      </Badge>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-xs text-emerald-700 font-medium">Speaking...</span>
                      </div>
                    </div>
                    
                    <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-700">
                      LIVE
                    </Badge>
                  </div>
                  
                  <div className="text-base leading-relaxed text-emerald-900 italic font-medium">
                    {interimText}
                  </div>
                </div>
              )
            ) : (
              interimSegment && (
                <div className="p-4 rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50/50 transition-all duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-800">
                        {formatSpeakerName(interimSegment.speaker)}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-xs text-emerald-700 font-medium">Speaking...</span>
                      </div>
                    </div>
                    
                    <Badge variant="outline" className="text-xs bg-emerald-100 text-emerald-700">
                      LIVE
                    </Badge>
                  </div>
                  
                  <div className="text-base leading-relaxed text-emerald-900 italic font-medium">
                    {interimSegment.text}
                  </div>
                </div>
              )
            )}
          </>
        )}
      </div>
      
      {/* Status Footer - Outside scroll area - Only show when NOT in System Audio mode */}
      {audioSource !== AudioSourceType.SYSTEM_AUDIO && (finalSegments.length > 0 || interimSegment || (browserMode === 'pure' && interimText)) && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {finalSegments.length} final segment{finalSegments.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-gray-500">
              Browser native speech recognition
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
