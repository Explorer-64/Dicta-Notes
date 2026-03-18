import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LanguagesIcon, MessageSquare } from 'lucide-react';
import { TranslationControls } from 'components/TranslationControls';

export interface GeminiSegment {
  id: string;
  text: string;
  speaker?: string;
  speakerName?: string;
  translation?: string;
  language?: string;
  timestamp?: any;
  isFinal?: boolean;
}

interface Props {
  segments: GeminiSegment[];
  currentSegment?: string;
  editingSegmentId?: string;
  onSpeakerEdit?: (segmentId: string) => void;
}

type DisplayMode = 'original' | 'translation' | 'both';

// Helper function to parse multi-speaker segments (from MultilingualDualTranscriptionDisplay)
function parseMultiSpeakerSegment(segment: GeminiSegment): GeminiSegment[] {
  const text = segment.text;
  
  // Check if this segment contains multiple speakers ("Speaker: text Speaker: more text")
  if (!text.includes(':') || !text.includes('Speaker')) {
    return [segment]; // Return original if no speaker format detected
  }
  
  // Split by double newlines or speaker patterns
  const speakerSections = text.split(/\r?\n\r?\n|(?=Speaker\s*\d*:)/).filter(section => section.trim());
  
  if (speakerSections.length <= 1) {
    return [segment]; // Return original if no multiple sections
  }
  
  const parsedSegments: GeminiSegment[] = [];
  
  speakerSections.forEach((section, index) => {
    const trimmedSection = section.trim();
    if (!trimmedSection) return;
    
    // Try to extract speaker name and text
    const speakerMatch = trimmedSection.match(/^(Speaker\s*\d*|[A-Za-z]+\s*\d*):\s*(.+)$/s);
    
    if (speakerMatch) {
      const [, speakerName, speakerText] = speakerMatch;
      parsedSegments.push({
        ...segment,
        id: `${segment.id}-parsed-${index}`,
        text: speakerText.trim(),
        speaker: speakerName.trim(),
        speakerName: speakerName.trim()
      });
    } else if (trimmedSection.includes(':')) {
      // Fallback: split on first colon
      const colonIndex = trimmedSection.indexOf(':');
      const speakerName = trimmedSection.substring(0, colonIndex).trim();
      const speakerText = trimmedSection.substring(colonIndex + 1).trim();
      
      if (speakerText) {
        parsedSegments.push({
          ...segment,
          id: `${segment.id}-parsed-${index}`,
          text: speakerText,
          speaker: speakerName,
          speakerName: speakerName
        });
      }
    }
  });
  
  return parsedSegments.length > 0 ? parsedSegments : [segment];
}

export function GeminiLiveDisplay({ 
  segments, 
  currentSegment, 
  editingSegmentId, 
  onSpeakerEdit 
}: Props) {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('original');
  
  // Parse multi-speaker segments into individual segments
  const parsedSegments = useMemo(() => {
    return segments.flatMap(segment => parseMultiSpeakerSegment(segment));
  }, [segments]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const hasTranslations = parsedSegments.some(segment => 
    segment.translation && segment.translation !== segment.text
  );

  return (
    <div className="space-y-4">
      {/* Translation Toggle Controls */}
      {hasTranslations && (
        <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border">
          <LanguagesIcon className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">Display Mode:</span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={displayMode === 'original' ? 'default' : 'outline'}
              onClick={() => setDisplayMode('original')}
              className="h-7 px-2 text-xs"
            >
              Original
            </Button>
            <Button
              size="sm"
              variant={displayMode === 'translation' ? 'default' : 'outline'}
              onClick={() => setDisplayMode('translation')}
              className="h-7 px-2 text-xs"
            >
              Translation
            </Button>
            <Button
              size="sm"
              variant={displayMode === 'both' ? 'default' : 'outline'}
              onClick={() => setDisplayMode('both')}
              className="h-7 px-2 text-xs"
            >
              Both
            </Button>
          </div>
        </div>
      )}

      {/* Segments Display */}
      <div className="space-y-3">
        {parsedSegments.map((segment) => {
          const hasTranslation = segment.translation && segment.translation !== segment.text;
          
          return (
            <div key={segment.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              {/* Header with speaker and metadata */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {(segment.speaker || segment.speakerName) && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs cursor-pointer hover:bg-purple-100 transition-colors ${
                        editingSegmentId === segment.id ? 'bg-purple-200 border-purple-400' : ''
                      }`}
                      onClick={() => onSpeakerEdit?.(segment.id)}
                      title="Click to edit speaker name"
                    >
                      {segment.speaker || segment.speakerName}
                    </Badge>
                  )}
                  {segment.language && (
                    <Badge variant="secondary" className="text-xs">
                      {segment.language.toUpperCase()}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs bg-purple-50">
                    Live
                  </Badge>
                </div>
                <span className="text-xs text-gray-500">
                  {formatTime(segment.timestamp)}
                </span>
              </div>

              {/* Content Display based on mode */}
              {displayMode === 'original' && (
                <div className="space-y-2">
                  <p className="text-gray-900 leading-relaxed">{segment.text}</p>
                </div>
              )}

              {displayMode === 'translation' && hasTranslation && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-600">Translation</span>
                  </div>
                  <p className="text-purple-800 leading-relaxed">{segment.translation}</p>
                </div>
              )}

              {displayMode === 'translation' && !hasTranslation && (
                <div className="space-y-2">
                  <p className="text-gray-500 italic">No translation available</p>
                </div>
              )}

              {displayMode === 'both' && (
                <div className="space-y-3">
                  {/* Original */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-600">Original</span>
                    </div>
                    <p className="text-gray-900 leading-relaxed">{segment.text}</p>
                  </div>
                  
                  {/* Translation */}
                  {hasTranslation && (
                    <div className="border-t pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-600">Translation</span>
                      </div>
                      <p className="text-purple-800 leading-relaxed">{segment.translation}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Translation controls for each segment */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <TranslationControls 
                  text={segment.text}
                  sourceLanguage={segment.language || "auto"}
                  colorScheme="purple"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Current Segment (Live) */}
      {currentSegment && (
        <div className="p-4 bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-300 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="default" className="text-xs bg-purple-600 text-white">
              LIVE NOW
            </Badge>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          </div>
          <p className="text-gray-900 italic leading-relaxed">{currentSegment}</p>
          
          {/* Translation controls for current segment */}
          <div className="mt-3 pt-3 border-t border-purple-200">
            <TranslationControls 
              text={currentSegment}
              sourceLanguage="auto"
              colorScheme="purple"
            />
          </div>
        </div>
      )}
    </div>
  );
}
