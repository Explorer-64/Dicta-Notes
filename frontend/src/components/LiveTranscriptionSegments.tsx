import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TranslationControls } from 'components/TranslationControls';
import { cn } from '@/lib/utils';
import { formatDurationLong } from 'utils/recording/RecordingTimerService';

interface TranscriptionSegment {
  text: string;
  speaker?: string;
  timestamp: number;
  language?: string;
}

interface Props {
  segments: TranscriptionSegment[];
  currentSegment?: string;
  isProcessing?: boolean;
}

const LiveTranscriptionSegments: React.FC<Props> = ({
  segments,
  currentSegment = '',
  isProcessing = false
}) => {
  // Create a mapping of unique speakers to consistent colors
  const uniqueSpeakers = Array.from(new Set(segments.map(seg => seg.speaker || 'Speaker')));
  
  const getSpeakerColor = (speaker: string | undefined) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-amber-100 text-amber-800 border-amber-200',
      'bg-rose-100 text-rose-800 border-rose-200',
    ];
    const speakerName = speaker || 'Speaker';
    const speakerIndex = uniqueSpeakers.indexOf(speakerName);
    return colors[speakerIndex % colors.length];
  };
  
  const getSpeakerColorScheme = (speaker: string | undefined) => {
    const schemes = ['blue', 'green', 'purple', 'amber', 'rose'];
    const speakerName = speaker || 'Speaker';
    const speakerIndex = uniqueSpeakers.indexOf(speakerName);
    return schemes[speakerIndex % schemes.length];
  };

  const formatTime = (timestamp: number) => {
    return formatDurationLong(timestamp);
  };

  return (
    <div className="space-y-4">
      {segments.length === 0 && !currentSegment ? (
        <div className="min-h-[450px] p-8 flex items-center justify-center text-gray-400 italic text-lg">
          Start recording to see transcript here...
        </div>
      ) : (
        <>
          {segments.map((segment, index) => {
            const speakerName = segment.speaker || `Speaker ${index + 1}`;
            const colorClass = getSpeakerColor(segment.speaker);
            const colorScheme = getSpeakerColorScheme(segment.speaker);
            
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${colorClass} transition-all duration-300`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold text-lg flex items-center gap-2">
                    {speakerName}
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    {formatTime(segment.timestamp)}
                  </Badge>
                </div>
                <div className="text-base leading-relaxed text-gray-800">
                  {segment.text}
                </div>
                
                {/* Translation controls */}
                <TranslationControls 
                  text={segment.text}
                  sourceLanguage={segment.language}
                  colorScheme={colorScheme}
                />
              </div>
            );
          })}
          
          {/* Current/interim segment */}
          {currentSegment && (
            <div className="p-4 rounded-lg border border-dashed border-blue-300 bg-blue-50">
              <div className="font-semibold text-lg flex items-center gap-2">
                <span>Current Speaker</span>
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </div>
              </div>
              <div className="text-base leading-relaxed text-blue-600 mt-2">
                {currentSegment}
              </div>
              
              {/* Translation controls for current segment */}
              {currentSegment && (
                <TranslationControls 
                  text={currentSegment}
                  sourceLanguage="auto"
                  colorScheme="blue"
                />
              )}
            </div>
          )}
        </>
      )}
      
      {isProcessing && (
        <div className="flex items-center justify-center p-6">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-sm text-gray-600">Processing with Gemini AI...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTranscriptionSegments;



