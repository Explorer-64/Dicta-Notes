

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Globe } from "lucide-react";
import { format } from "date-fns";
import { formatTime } from "utils/transcriptionUtils";
import { Company } from "utils/company";
import { TranslationControls } from "components/TranslationControls";
import { getLanguageName } from "utils/languageUtils";
import { TranscriptionSegment } from "types";
import { AssignSpeakerPopover } from "components/AssignSpeakerPopover";
import brain from "brain";
import { toast } from "sonner";
import { useUserGuardContext } from "app";
import { Badge } from "@/components/ui/badge";
import { nanoid } from "nanoid";

interface Speaker {
  id: string;
  name: string;
  confidence?: number;
}

interface TranscriptDisplayProps {
  fullText?: string;
  title: string;
  createdAt: number;
  duration?: number;
  speakers?: Speaker[];
  segments?: TranscriptionSegment[];
  meetingPurpose?: string;
  company?: Company;
  clientName?: string;
  projectName?: string;
  notes?: string;
  sessionId?: string; // Add sessionId for speaker assignment
  sessionUserId?: string; // Add session owner ID for permission checking
  onSeekRequest?: (time: number) => void; // Called when a timestamp is clicked
  savedTranslation?: { langCode: string; texts: string[] } | null;
}

export function TranscriptDisplay({ fullText, title, createdAt, duration, speakers, segments, meetingPurpose, company, clientName, projectName, notes, sessionId, sessionUserId, onSeekRequest, savedTranslation }: TranscriptDisplayProps) {
  const { user } = useUserGuardContext();
  
  // State for managing user-assigned segments
  const [userAssignedSegments, setUserAssignedSegments] = React.useState<Map<number, {
    speakerId: string;
    speakerName: string;
    originalSpeaker: { id: string; name: string; confidence?: number };
  }>>(new Map());
  
  // State for available speakers (includes session speakers + any new ones)
  const [availableSpeakers, setAvailableSpeakers] = React.useState<Speaker[]>(speakers || []);
  
  // State for loading states per segment
  const [loadingSegments, setLoadingSegments] = React.useState<Set<number>>(new Set());
  
  // Check if current user can edit (owns the session)
  const canEdit = Boolean(sessionId && sessionUserId && user && user.uid === sessionUserId);
  
  // Update available speakers when speakers prop changes
  React.useEffect(() => {
    if (speakers) {
      setAvailableSpeakers(speakers);
    }
  }, [speakers]);
  
  // Handler for assigning speaker to a segment
  const handleAssignSpeaker = async (segmentIndex: number, speakerId: string, speakerName: string, isNew: boolean) => {
    if (!sessionId || !segments || !segments[segmentIndex]) {
      toast.error('Cannot assign speaker: missing session or segment data');
      return;
    }
    
    const segment = segments[segmentIndex];
    const segSpeaker = (segment as any).speaker as { id?: string; name?: string; confidence?: number } | string | undefined;
    
    // Capture original speaker info for revert functionality
    const originalSpeaker = {
      id: typeof segSpeaker === 'string' ? segSpeaker : segSpeaker?.id || 'unknown',
      name: typeof segSpeaker === 'object' ? segSpeaker?.name || 'Unknown' : segSpeaker || 'Unknown',
      confidence: typeof segSpeaker === 'object' ? segSpeaker?.confidence : undefined
    };
    
    // Add new speaker to available speakers if it's new
    if (isNew) {
      const newSpeaker: Speaker = {
        id: speakerId,
        name: speakerName,
        confidence: 1.0 // User-assigned speakers have 100% confidence
      };
      setAvailableSpeakers(prev => [...prev, newSpeaker]);
    }
    
    // Set loading state
    setLoadingSegments(prev => new Set([...prev, segmentIndex]));
    
    try {
      // Optimistic update
      setUserAssignedSegments(prev => new Map([
        ...prev,
        [segmentIndex, {
          speakerId,
          speakerName,
          originalSpeaker: userAssignedSegments.get(segmentIndex)?.originalSpeaker || originalSpeaker
        }]
      ]));
      
      // Prepare updated segment for API
      const updatedSegment = {
        ...segment,
        speaker: {
          id: speakerId,
          name: speakerName,
          confidence: 1.0
        },
        userAssigned: true,
        originalSpeaker: userAssignedSegments.get(segmentIndex)?.originalSpeaker || originalSpeaker
      };
      
      // Save to backend
      const response = await brain.save_segment_to_firestore_api(
        { session_id: sessionId },
        updatedSegment
      );
      
      if (!response.ok) {
        throw new Error(`Failed to save segment: ${response.status}`);
      }
      
      toast.success(`Speaker assigned to "${speakerName}"`);
      
    } catch (error) {
      console.error('Error assigning speaker:', error);
      toast.error('Failed to assign speaker. Please try again.');
      
      // Revert optimistic update on error
      setUserAssignedSegments(prev => {
        const newMap = new Map(prev);
        newMap.delete(segmentIndex);
        return newMap;
      });
      
      // Remove new speaker if it was just added
      if (isNew) {
        setAvailableSpeakers(prev => prev.filter(s => s.id !== speakerId));
      }
    } finally {
      // Clear loading state
      setLoadingSegments(prev => {
        const newSet = new Set(prev);
        newSet.delete(segmentIndex);
        return newSet;
      });
    }
  };
  
  // Handler for reverting to AI assignment
  const handleRevertToAI = async (segmentIndex: number) => {
    if (!sessionId || !segments || !segments[segmentIndex]) {
      toast.error('Cannot revert: missing session or segment data');
      return;
    }
    
    const userAssignment = userAssignedSegments.get(segmentIndex);
    if (!userAssignment?.originalSpeaker) {
      toast.error('Cannot revert: original speaker data not found');
      return;
    }
    
    // Set loading state
    setLoadingSegments(prev => new Set([...prev, segmentIndex]));
    
    try {
      // Optimistic update
      setUserAssignedSegments(prev => {
        const newMap = new Map(prev);
        newMap.delete(segmentIndex);
        return newMap;
      });
      
      // Prepare reverted segment for API
      const revertedSegment = {
        ...segments[segmentIndex],
        speaker: userAssignment.originalSpeaker,
        userAssigned: false,
        originalSpeaker: undefined
      };
      
      // Save to backend
      const response = await brain.save_segment_to_firestore_api(
        { session_id: sessionId },
        revertedSegment
      );
      
      if (!response.ok) {
        throw new Error(`Failed to revert segment: ${response.status}`);
      }
      
      toast.success('Reverted to AI assignment');
      
    } catch (error) {
      console.error('Error reverting speaker:', error);
      toast.error('Failed to revert speaker. Please try again.');
      
      // Revert optimistic update on error
      setUserAssignedSegments(prev => new Map([
        ...prev,
        [segmentIndex, userAssignment]
      ]));
    } finally {
      // Clear loading state
      setLoadingSegments(prev => {
        const newSet = new Set(prev);
        newSet.delete(segmentIndex);
        return newSet;
      });
    }
  };
  
  // Format transcript to highlight speaker names
  // Helper function to detect language in a segment
  const detectLanguage = (text: string): string => {
    // This is a simplified language detection function
    // The app now relies on Gemini API for accurate language detection
    // This client-side function is used as a fallback when structured language data is not available
    
    // Check if the text has explicit language markup from the enhanced prompt
    const langMarkup = text.match(/\[([a-z]{2})\]\s/);
    if (langMarkup) {
      return langMarkup[1]; // Return the detected language code
    }
    
    // Fallback to simple language detection if no markup is present
    // Check for some common language indicators
    if (/[\u0600-\u06FF]/.test(text)) return 'ar'; // Arabic
    if (/[\u0400-\u04FF]/.test(text)) return 'ru'; // Cyrillic (Russian)
    if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text)) return 'zh'; // CJK (Chinese/Japanese/Korean)
    if (/[áéíóúüñ¿¡]/i.test(text)) return 'es'; // Spanish
    if (/[àâçéèêëîïôùûüÿœæ]/i.test(text)) return 'fr'; // French
    if (/[äöüß]/i.test(text)) return 'de'; // German
    return 'en'; // Default to English
  };

  // Use segments if available, fallback to fullText processing
  const formattedTranscript = React.useMemo(() => {
    if (segments && segments.length > 0) {
      // Display structured segments with timestamps
      return segments.map((segment, index) => {
        // Check if this segment has a user assignment override
        const userAssignment = userAssignedSegments.get(index);
        const isLoading = loadingSegments.has(index);
        
        // Resolve speaker id/name from segment first, then fall back to speakers list, then user assignment
        let finalSpeaker: { id: string; name: string; confidence?: number };
        let isUserAssigned = false;
        let originalSpeaker: { id: string; name: string; confidence?: number } | undefined;
        
        if (userAssignment) {
          // Use user assignment
          finalSpeaker = {
            id: userAssignment.speakerId,
            name: userAssignment.speakerName,
            confidence: 1.0 // User assignments have 100% confidence
          };
          isUserAssigned = true;
          originalSpeaker = userAssignment.originalSpeaker;
        } else {
          // Use original segment speaker info
          const segSpeaker = (segment as any).speaker as { id?: string; name?: string; confidence?: number } | string | undefined;
          const segSpeakerId = typeof segSpeaker === 'string' ? segSpeaker : segSpeaker?.id;
          const fallbackInfo = speakers?.find((s) => s.id === segSpeakerId);
          
          finalSpeaker = {
            id: segSpeakerId || 'unknown',
            name: (typeof segSpeaker === 'object' && segSpeaker?.name) || fallbackInfo?.name || 'Unknown',
            confidence: (typeof segSpeaker === 'object' ? segSpeaker?.confidence : undefined) ?? fallbackInfo?.confidence
          };
          
          // Check if this segment was originally user-assigned (from server data)
          if ((segment as any).userAssigned) {
            isUserAssigned = true;
            originalSpeaker = (segment as any).originalSpeaker;
          }
        }
        
        const text = segment.text;
        const startTime = segment.start_time;
        const detectedLanguage = segment.language || detectLanguage(text);
        const nonEnglish = detectedLanguage !== 'en';
        const isUnknown = /^unknown\b/i.test(finalSpeaker.name) || /Unknown Speaker/i.test(finalSpeaker.name);
        
        return (
          <div key={index} className="mb-4 group">
            <div className="mb-2 flex items-start gap-2">
              {/* Timestamp display for audio navigation */}
              <span
                className={`text-xs bg-muted px-2 py-1 rounded-md min-w-fit font-mono transition-colors ${onSeekRequest ? 'text-primary cursor-pointer hover:bg-primary hover:text-primary-foreground' : 'text-muted-foreground'}`}
                onClick={onSeekRequest ? () => onSeekRequest(startTime) : undefined}
                title={onSeekRequest ? 'Click to play from here' : undefined}
              >
                {formatTime(Math.round(startTime))}
              </span>
              <div className="flex-1">
                {finalSpeaker.name && (
                  <div className="inline-flex items-center gap-1 mr-1">
                    <AssignSpeakerPopover
                      currentSpeaker={finalSpeaker}
                      availableSpeakers={availableSpeakers}
                      isUserAssigned={isUserAssigned}
                      originalSpeaker={originalSpeaker}
                      canEdit={canEdit}
                      onAssignSpeaker={(speakerId, speakerName, isNew) => 
                        handleAssignSpeaker(index, speakerId, speakerName, isNew)
                      }
                      onRevertToAI={originalSpeaker ? () => handleRevertToAI(index) : undefined}
                      isLoading={isLoading}
                    >
                      <span className={`
                        inline-flex items-center gap-1 font-semibold mr-1
                        ${isUnknown 
                          ? "text-gray-500 italic" 
                          : "text-blue-600"
                        }
                        ${canEdit 
                          ? "cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded transition-colors" 
                          : ""
                        }
                        ${isUserAssigned 
                          ? "bg-blue-100 border border-blue-200 px-1 py-0.5 rounded" 
                          : ""
                        }
                      `}>
                        {finalSpeaker.name}
                        {finalSpeaker.confidence !== undefined && !isUnknown && (
                          <span className="text-sm font-normal text-gray-500 ml-1">
                            ({Math.round(finalSpeaker.confidence * 100)}%)
                          </span>
                        )}
                        {isUserAssigned && (
                          <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                            User
                          </Badge>
                        )}
                        {isLoading && (
                          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin ml-1" />
                        )}
                      </span>
                    </AssignSpeakerPopover>
                    <span>:</span>
                  </div>
                )}
                <span>{text}</span>
                {nonEnglish && (
                  <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                    {getLanguageName(detectedLanguage)}
                  </span>
                )}
              </div>
            </div>
            {/* Saved (batch) translation — persisted in Firestore */}
            {savedTranslation?.texts[index] && (
              <div className="flex items-start gap-1.5 mt-1 mb-1 text-sm text-muted-foreground italic pl-1">
                <Globe className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-400" />
                <span className="text-xs font-medium text-blue-500 uppercase tracking-wide shrink-0">
                  {savedTranslation.langCode}
                </span>
                <span>{savedTranslation.texts[index]}</span>
              </div>
            )}
            {/* Per-sentence translation controls (always visible, independent of saved translation) */}
            <TranslationControls
              text={text}
              sourceLanguage={detectedLanguage}
              colorScheme={"blue"}
            />
          </div>
        );
      });
    } else if (fullText) {
      // Fallback to original fullText processing
      const lines = fullText.split("\n");
      
      return lines.map((line, index) => {
        // Check if line starts with a speaker name
        const speakerMatch = line.match(/^([^:]+):\s(.+)$/);
        
        if (speakerMatch) {
          const [_, speakerName, text] = speakerMatch;
          // Detect language for this segment
          const detectedLanguage = detectLanguage(text);
          const nonEnglish = detectedLanguage !== 'en';
          
          return (
            <div key={index} className="mb-4">
              <div className="mb-2">
                <span className="font-semibold text-blue-600 mr-1">{speakerName}:</span>
                <span>{text}</span>
                {nonEnglish && (
                  <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                    {getLanguageName(detectedLanguage)}
                  </span>
                )}
              </div>
              {/* Show translation controls for all segments */}
              <TranslationControls 
                text={text}
                sourceLanguage={detectedLanguage}
                colorScheme={"blue"}
              />
            </div>
          );
        }
        return <div key={index} className="mb-2">{line}</div>;
      });
    } else {
      return [];
    }
  }, [segments, fullText, speakers, userAssignedSegments, loadingSegments, availableSpeakers, canEdit, savedTranslation]);
  
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground mt-1">
            Save this transcript in any format for permanent local storage
          </div>
        </div>
        <CardTitle>Meeting Transcript</CardTitle>
      </CardHeader>
      <CardContent>
        {fullText ? (
          <ScrollArea className="h-[400px] rounded-md border p-4">
            <div className="whitespace-pre-wrap font-mono text-sm">
              {formattedTranscript}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No transcript available for this session.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
