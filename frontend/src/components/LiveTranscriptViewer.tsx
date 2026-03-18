import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useLiveTranscriptSegments, LiveFirestoreSegment } from "utils/hooks/useLiveTranscriptSegments";
import { ShareSessionLink } from "components/ShareSessionLink";
import { isIOSDevice } from "utils/deviceDetection";

interface Props {
  sessionId: string | null;
  meetingTitle?: string;
}

export const LiveTranscriptViewer: React.FC<Props> = ({ sessionId, meetingTitle }) => {
  const { segments: liveTranscriptSegments, isLoading } = useLiveTranscriptSegments(sessionId);
  const [formattedTranscript, setFormattedTranscript] = useState<string>("");
  const [waitingForData, setWaitingForData] = useState<boolean>(true);
  const [connectionEstablished, setConnectionEstablished] = useState<boolean>(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveTranscriptSegments]);

  // Debug timeout for connection issues
  useEffect(() => {
    // Set up a timer to check if we've received data
    let timer = null;
    
    if (sessionId) {
      // If we haven't gotten any segments after 5 seconds, log this for debugging
      timer = setTimeout(() => {
        console.log(`Timer expired: Still waiting for data, segments: ${liveTranscriptSegments.length}`);
        
        // If we have a sessionId but no segments after 10 seconds, we'll assume there's a connection issue
        if (liveTranscriptSegments.length === 0) {
          setWaitingForData(true);
        }
      }, 5000);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [sessionId, liveTranscriptSegments.length]);

  // Set connection status and monitor for data
  useEffect(() => {
    // Set connection as established once we have a response from Firestore
    // (even if there are no segments yet)
    setConnectionEstablished(true);
    console.log("Connection to Firestore established");
    
    // After 5 seconds, if no segments have arrived, keep waiting state true
    // but we know we're connected to Firestore
    const timer = setTimeout(() => {
      const stillWaiting = liveTranscriptSegments.length === 0;
      setWaitingForData(stillWaiting);
      console.log(`Timer expired: ${stillWaiting ? 'Still waiting for data' : 'Data arrived'}, segments: ${liveTranscriptSegments.length}`);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [sessionId, liveTranscriptSegments.length]);

  // Update waiting state whenever new segments arrive
  useEffect(() => {
    if (liveTranscriptSegments.length > 0) {
      console.log(`Setting waitingForData=false because we have ${liveTranscriptSegments.length} segments`);
      setWaitingForData(false);
    }
  }, [liveTranscriptSegments]);

  if (!sessionId) {
    return (
      <Card className="p-6 text-center border-red-200 bg-red-50">
        <CardContent>
          <h2 className="text-lg font-semibold text-red-700 mb-2">No Session ID Provided</h2>
          <p className="text-red-600 mb-4">A session ID is required to view a live transcript.</p>
        </CardContent>
      </Card>
    );
  }

  // Group segments by speaker
  const groupedBySpaker: { [speaker: string]: { name: string; segments: LiveFirestoreSegment[] } } = {};
  
  // Safe serializer for Firestore objects to prevent circular JSON errors
  const safeStringify = (obj: any, space?: number) => {
    return JSON.stringify(obj, (key, value) => {
      // Convert Firestore Timestamps to ISO strings
      if (value && typeof value === 'object' && value.toDate) {
        return value.toDate().toISOString();
      }
      return value;
    }, space);
  };
  
  // Debug: Log what we're rendering
  console.log("LiveTranscriptViewer rendering with", liveTranscriptSegments.length, "segments");
  console.log("Live segments data:", safeStringify(liveTranscriptSegments.slice(0, 2)));
  
  // Force a log of each segment's properties to help debug
  liveTranscriptSegments.forEach((segment, index) => {
    // Explicitly log all properties of each segment
    const { id, text, speaker, timestamp, isFinal } = segment;
    console.log(`Segment ${index} properties:`, { 
      id, 
      text, 
      speaker, 
      timestamp: timestamp ? timestamp.toDate?.().toISOString() : 'undefined',
      isFinal
    });
    
    // Continue with grouping logic
    const speakerKey = speaker || 'Unknown Speaker';
    if (!groupedBySpaker[speakerKey]) {
      groupedBySpaker[speakerKey] = {
        name: speaker || 'Unknown Speaker',
        segments: []
      };
      console.log(`Created new speaker group for: ${speakerKey}`);
    }
    groupedBySpaker[speakerKey].segments.push(segment);
  });
  
  // Debug: Log the grouped data structure
  console.log("Grouped by speaker:", Object.keys(groupedBySpaker));
  Object.entries(groupedBySpaker).forEach(([speaker, { name, segments }]) => {
    console.log(`Speaker group: ${speaker}, name: ${name}, segments count: ${segments.length}`);
  });

  return (
    <div className="live-transcript-viewer">
      <Card className="shadow-sm border-blue-100">
        {/* DEBUG: Session ID being used: {sessionId} */}
        <CardContent className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-800">
              Live Meeting Transcript
              <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                {sessionId.substring(0, 8)}...
              </Badge>
            </h2>
            
            {/* Status indicator */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`flex items-center gap-2`}>
                    <div className={`h-3 w-3 rounded-full ${waitingForData ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></div>
                    <span className="text-sm text-muted-foreground">
                      {connectionEstablished && waitingForData ? 'Connected - Waiting for meeting to start' : 
                       connectionEstablished ? 'Live' : 'Connecting...'}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {connectionEstablished && waitingForData ? 'Waiting for transcript data...' : 
                   connectionEstablished ? 'Receiving live transcript' : 'Connecting to session...'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Waiting for recording to start */}
          {waitingForData && (
            <div className="text-center py-10 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50">
              <div className="animate-pulse space-y-4">
                <div className="h-4 w-4 bg-blue-400 rounded-full mx-auto"></div>
                <p className="text-blue-700 font-medium">Waiting for the meeting to start...</p>
                {isIOSDevice() && (
                  <p className="text-xs text-blue-600 max-w-md mx-auto">
                    Note: If you're on iOS, make sure to keep this browser tab active to receive updates.
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Live transcript content */}
          {!waitingForData && (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Debug panel - will show raw segment data */}
                <div className="p-4 mb-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium mb-2">Debug Information</h3>
                  <p className="text-sm mb-1">Connection: {connectionEstablished ? 'Established' : 'Not Connected'}</p>
                  <p className="text-sm mb-1">Total Segments: {liveTranscriptSegments.length}</p>
                  <p className="text-sm mb-1">Speaker Groups: {Object.keys(groupedBySpaker).length}</p>
                  <p className="text-sm mb-3">Raw Segments Sample:</p>
                  <div className="text-xs bg-white p-2 rounded max-h-32 overflow-auto">
                    {liveTranscriptSegments.length > 0 ? (
                      <pre>{safeStringify(liveTranscriptSegments[0], 2)}</pre>
                    ) : (
                      <p>No segments available</p>
                    )}
                  </div>
                </div>
                
                {Object.entries(groupedBySpaker).map(([speaker, { name, segments }]) => (
                  <div key={speaker} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-700">{name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="font-semibold">{name}</span>
                    </div>
                    <div className="pl-10 space-y-2">
                      {segments.map((segment, idx) => (
                        <div key={`${speaker}-${idx}`} className="p-3 bg-white rounded-lg shadow-sm border">
                          {segment.text}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      
      {/* Shareable link */}
      <div className="mt-4">
        <Card>
          <CardContent className="p-4">
            <ShareSessionLink sessionId={sessionId} meetingTitle={meetingTitle} />
          </CardContent>
        </Card>
      </div>
    </div>
  );

};
