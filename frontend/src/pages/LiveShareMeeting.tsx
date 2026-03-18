import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCurrentUser } from "app";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { firebaseApp } from "app";
import { useLiveTranscriptSegments } from "utils/hooks/useLiveTranscriptSegments";
import { useAutoTranslateSegments } from "utils/useAutoTranslateSegments";
import { useLanguageStore } from "utils/languageStore";
import { getLanguageName } from "utils/languageUtils";
import { LiveTranscription } from "components/LiveTranscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Clock, Share2, Languages } from "lucide-react";
import { Header } from "components/Header";
import { NoIndexMeta } from "components/NoIndexMeta";

interface SessionData {
  title?: string;
  meetingTitle?: string;
  userId?: string; // ID of the user who created/owns the session
  status?: string; // e.g., 'awaiting_recording', 'recording', 'completed'
  hostName?: string;
  // Add other relevant session fields as needed
}

const LiveShareMeeting: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const { user: currentUser, loading: userLoading } = useCurrentUser();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get live transcript segments
  const { segments, isLoading: isLoadingSegments } = useLiveTranscriptSegments(sessionId);
  
  // Debug: Log session info
  useEffect(() => {
    console.log("LiveShareMeeting - Session ID from URL:", sessionId);
    console.log("LiveShareMeeting - Segments received:", segments.length);
    if (segments.length > 0) {
      console.log("LiveShareMeeting - Latest segment:", segments[segments.length - 1]);
    }
  }, [sessionId, segments]);
  
  // Initialize language preference for automatic translation
  const { preferredLanguage } = useLanguageStore();
  
  // Automatically translate segments based on user's preferred language
  const { translatedSegments, isTranslating } = useAutoTranslateSegments(segments);

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided");
      setIsLoadingSession(false);
      return;
    }

    const loadSessionData = async () => {
      try {
        const db = getFirestore(firebaseApp);
        const sessionDoc = await getDoc(doc(db, "sessions", sessionId));
        
        if (sessionDoc.exists()) {
          setSessionData(sessionDoc.data() as SessionData);
        } else {
          setError("Session not found");
        }
      } catch (err) {
        console.error("Error loading session:", err);
        setError("Failed to load session");
      } finally {
        setIsLoadingSession(false);
      }
    };

    loadSessionData();
  }, [sessionId]);

  if (!sessionId) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto p-4">
          <Card>
            <CardHeader>
              <CardTitle>Invalid Session</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">No session ID provided. Please check your link.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (isLoadingSession) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto p-4">
          <Card>
            <CardContent>
              <p>Loading session...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto p-4">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Create a more robust title fallback
  const meetingTitle = sessionData?.title || sessionData?.meetingTitle || `Meeting ${sessionId?.slice(-8) || 'Unknown'}`;

  return (
    <div className="flex flex-col min-h-screen">
      <NoIndexMeta />
      <Header />
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-white rounded-lg border p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Live Meeting Transcript</h1>
            </div>
            
            {sessionData?.title && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800">{sessionData.title}</h2>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 flex-shrink-0" />
                <span className="break-all">Session ID: {sessionId}</span>
              </div>
              {sessionData?.hostName && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Host: {sessionData.hostName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>Live</span>
              </div>
              {preferredLanguage !== 'en' && (
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 flex-shrink-0" />
                  <Badge variant="secondary" className="text-xs">
                    {getLanguageName(preferredLanguage)}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {(isLoadingSession || isLoadingSegments) && (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading transcript...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transcript Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                Real-time Transcript
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {isLoadingSegments || isTranslating ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span className="text-gray-500">
                      {isLoadingSegments ? 'Loading transcript...' : 'Translating...'}
                    </span>
                  </div>
                ) : translatedSegments && translatedSegments.length > 0 ? (
                  translatedSegments.map((segment, index) => {
                    // Handle different speaker name formats from Firestore
                    const speakerName = typeof segment.speakerName === 'string' 
                      ? segment.speakerName 
                      : segment.speakerName?.name || `Speaker ${segment.speakerId || 'Unknown'}`;
                    
                    // Handle timestamp conversion from Firestore Timestamp
                    const timestamp = segment.timestamp?.toDate ? segment.timestamp.toDate() : new Date();
                    
                    return (
                      <div key={segment.id || index} className="p-3 bg-white rounded border">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          <span className="text-sm font-medium text-gray-700">
                            {speakerName}
                          </span>
                          <span className="text-xs text-gray-400">
                            {timestamp.toLocaleTimeString()}
                          </span>
                          {segment.language && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                              {segment.language.toUpperCase()}
                            </span>
                          )}
                          {segment.translatedFrom && segment.translatedTo && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                              Translated from {segment.translatedFrom.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-800">{segment.text}</p>
                        {segment.originalText && segment.originalText !== segment.text && (
                          <p className="text-sm text-gray-600 mt-2 italic border-l-2 border-gray-300 pl-3">
                            Original: {segment.originalText}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No transcript available yet.</p>
                    <p className="text-sm text-gray-400 mt-1">
                      The transcript will appear here when the host starts recording.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default LiveShareMeeting;
