import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "app";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "utils/firebase";
import { Share2 } from "lucide-react";

interface Props {
  onSessionSelect: (sessionId: string, sessionTitle: string) => void;
  selectedSessionId?: string;
}

interface ShareableSession {
  id: string;
  title: string;
  createdAt: string;
}

export const ShareableSessionDropdown: React.FC<Props> = ({ 
  onSessionSelect, 
  selectedSessionId 
}) => {
  const { user } = useCurrentUser();
  const [shareableSessions, setShareableSessions] = useState<ShareableSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user's shareable sessions from Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

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
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user || loading) {
    return null;
  }

  if (shareableSessions.length === 0) {
    return null;
  }

  return (
    <section className="mb-4 sm:mb-6">
      <div className="space-y-2">
        <Label className="flex items-center gap-1">
          <Share2 size={16} className="text-muted-foreground" />
          Record for Existing Shareable Session
        </Label>
        <Select 
          value={selectedSessionId || "none"} 
          onValueChange={(value) => {
            if (value === "none") {
              onSessionSelect("none", "");
            } else if (value) {
              const session = shareableSessions.find(s => s.id === value);
              if (session) {
                onSessionSelect(value, session.title);
              }
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a shareable session (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Create new session</SelectItem>
            {shareableSessions.map((session) => (
              <SelectItem key={session.id} value={session.id}>
                {session.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Recording for a shareable session allows others to view the transcript in real-time
        </p>
      </div>
    </section>
  );
};