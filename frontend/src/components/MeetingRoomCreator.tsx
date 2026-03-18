import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Share, Mic } from "lucide-react";
import brain from "brain";
import { ShareSessionLink } from "./ShareSessionLink";

interface Props {
  meetingTitle: string;
  clientName?: string | null;
  projectName?: string | null;
  tags?: string[] | null;
  onSessionCreated: (sessionId: string) => void;
  onStartRecording: () => void;
}

export const MeetingRoomCreator: React.FC<Props> = ({ 
  meetingTitle,
  clientName,
  projectName,
  tags,
  onSessionCreated,
  onStartRecording
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createSession = async () => {
    if (isCreating) return;
    
    try {
      setIsCreating(true);
      
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

  const handleStartRecording = () => {
    if (!sessionId) {
      toast.error("Please create a meeting room first");
      return;
    }
    onStartRecording();
  };

  return (
    <Card className="shadow-sm mb-6">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-medium mb-2">Create Meeting Room</h3>
          <p className="text-sm text-muted-foreground">
            First create a meeting room to get a shareable link, then start recording when everyone has joined.
          </p>
        </div>

        {!sessionId ? (
          <Button 
            className="w-full flex items-center justify-center gap-2 py-6 text-lg"
            onClick={createSession}
            disabled={isCreating}
          >
            <div className="bg-primary/10 p-2 rounded-full">
              <Share className="h-6 w-6 text-primary" />
            </div>
            <span>{isCreating ? "Creating..." : "Create Meeting Room"}</span>
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <p className="font-semibold text-sm">Meeting Room Ready</p>
              </div>
              <ShareSessionLink sessionId={sessionId} meetingTitle={meetingTitle} />
              <p className="text-xs text-center mt-2 text-blue-700">
                Share this link with meeting participants so they can join
              </p>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 py-6 text-lg"
              onClick={handleStartRecording}
            >
              <div className="bg-red-100 p-2 rounded-full">
                <Mic className="h-6 w-6 text-red-500" />
              </div>
              <span>Start Recording</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
