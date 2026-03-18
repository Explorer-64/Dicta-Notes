import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { SessionRepository } from "utils/session";
import { ShareSessionLink } from "components/ShareSessionLink";
import { useCurrentUser } from "app";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "utils/firebase";
import { Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  meetingTitle?: string;
  companyId?: string | null;
  meetingPurpose?: string;
}

interface ShareableSession {
  id: string;
  title: string;
  createdAt: string;
}

export const CreateEmptySession: React.FC<Props> = ({
  meetingTitle: initialTitle = "",
  companyId = null,
  meetingPurpose = "",
}) => {
  const { user } = useCurrentUser();
  const [isCreating, setIsCreating] = useState(false);
  const [shareableSessions, setShareableSessions] = useState<ShareableSession[]>([]);
  const [title, setTitle] = useState(initialTitle);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Load user's shareable sessions from Firestore
  useEffect(() => {
    if (!user) return;

    // Simple query that only filters by userId (no composite index needed)
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid),
      where('metadata.createdForSharing', '==', true)
    );

    const unsubscribe = onSnapshot(sessionsQuery, (snapshot) => {
      const sessions: ShareableSession[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        sessions.push({
          id: doc.id,
          title: data.title || 'Untitled Session',
          createdAt: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString()
        });
      });
      // Sort by creation date in memory (newest first)
      sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setShareableSessions(sessions);
    });

    return () => unsubscribe();
  }, [user]);

  const createEmptySession = async () => {
    if (!title.trim()) {
      toast.error("Please enter a meeting title");
      return;
    }

    setIsCreating(true);

    try {
      // Create a minimal session in Firestore
      const sessionData = {
        title: title.trim(),
        full_text: "", // Empty transcript
        duration: 0, // No duration yet
        metadata: {
          companyId: companyId || null,
          meetingPurpose: meetingPurpose || null,
          hasAudio: false,
          hasTranscriptStorage: true,
          createdForSharing: true, // Flag to indicate this was created just for sharing
          status: "awaiting_recording"
        },
      };

      // Create the session
      const newSessionId = await SessionRepository.createSession(sessionData, companyId || undefined);
      
      toast.success("Live session created! Share the link to allow others to view.");
      setTitle("");
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating empty session:", error);
      toast.error("Could not create session. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await SessionRepository.deleteSession(sessionId);
      toast.success("Session deleted successfully");
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error("Could not delete session");
    }
  };

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">Please log in to create shareable sessions.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center justify-between">
          Your Shareable Sessions
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create New
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showCreateForm && (
          <div className="space-y-4 mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="space-y-2">
              <Label htmlFor="meeting-title">Meeting Title</Label>
              <Input
                id="meeting-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter meeting title"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={createEmptySession} 
                disabled={isCreating || !title.trim()}
                className="flex-1"
              >
                {isCreating ? "Creating..." : "Create Shareable Link"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateForm(false);
                  setTitle("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        
        {shareableSessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No shareable sessions yet. Create one to allow others to join your meetings.
            </p>
            {!showCreateForm && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create Your First Session
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {shareableSessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{session.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(session.createdAt).toLocaleDateString()} at {new Date(session.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSession(session.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <ShareSessionLink sessionId={session.id} meetingTitle={session.title} />
                

              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-700">
            Share these links with meeting participants. They will see transcriptions in real-time when you start recording.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
