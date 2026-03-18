import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Share } from 'lucide-react';
import brain from 'brain';
import { ShareSessionLink } from './ShareSessionLink';

interface Props {
  meetingTitle: string;
  clientName?: string | null;
  projectName?: string | null;
  tags?: string[] | null;
  onSessionCreated: (sessionId: string) => void;
}

export const SessionCreator: React.FC<Props> = ({
  meetingTitle,
  clientName,
  projectName,
  tags,
  onSessionCreated
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createSession = async () => {
    if (isCreating) return;
    
    setIsCreating(true);
    try {
      console.log("Creating new session before recording...");
      const initialSessionResponse = await brain.save_session({
        title: meetingTitle || "Untitled Meeting",
        client_name: clientName || null,
        project_name: projectName || null,
        tags: tags && tags.length > 0 ? tags : null,
        duration: 0, // Initial duration is 0
      });
      
      if (initialSessionResponse.ok) {
        const sessionData = await initialSessionResponse.json();
        if (sessionData && sessionData.session_id) {
          setSessionId(sessionData.session_id);
          onSessionCreated(sessionData.session_id);
          console.log("Session created with ID:", sessionData.session_id);
          toast.success("Meeting room created! Share the link with others before starting the recording.");
        } else {
          console.error("Failed to get session_id from save_session response", sessionData);
          toast.error("Could not create meeting room. Please try again.");
        }
      } else {
        const errorText = await initialSessionResponse.text();
        console.error("Failed to create session:", initialSessionResponse.status, errorText);
        toast.error(`Could not create meeting room: ${errorText}. Please try again.`);
      }
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Error creating meeting room. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {!sessionId ? (
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-medium">Create a Meeting Room</h3>
              <p className="text-muted-foreground">
                First create a meeting room to get a shareable link, then invite participants before starting recording.
              </p>
              <Button
                className="w-full sm:w-auto flex items-center justify-center gap-2 py-6 text-lg"
                onClick={createSession}
                disabled={isCreating}
              >
                <div className="bg-primary/10 p-2 rounded-full">
                  <Share className="h-6 w-6 text-primary" />
                </div>
                <span>{isCreating ? "Creating..." : "Create Meeting Room"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border-2 border-blue-300 shadow-md">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 justify-center mb-2">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                <h3 className="text-lg font-semibold text-center">Meeting Room Active</h3>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 mb-4">
                  <span className="font-medium">Your meeting room is ready!</span> Share this link with participants 
                  so they can join and view the live transcript.
                </p>
                
                <ShareSessionLink sessionId={sessionId} meetingTitle={meetingTitle} />
                
                <p className="text-xs text-blue-600 mt-4">
                  When everyone has joined, start recording to begin the transcription.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
