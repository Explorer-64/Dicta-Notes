// Session item type is now imported from useSessionsOfflineState
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { formatTime, formatUnixTimestamp } from "utils/transcriptionUtils";
import { Header } from "components/Header";
import { ProtectedRoute } from "components/ProtectedRoute";
import { MigrationManager } from "components/MigrationManager";
import brain from "brain";
import { SessionListItem } from "types"; // Assuming SessionListItem is the correct type from types.ts
import { useUserGuardContext } from "app";
import { toast } from "sonner";
import { WifiOff, RefreshCw, Users, Clock, Tag, FileEdit, Headphones, FileText, Upload } from "lucide-react";
import { SessionAudioPlayer } from "components/SessionAudioPlayer";
import { SessionFilters, SessionFilterState } from "components/SessionFilters";
import UploadAudioSession from "components/UploadAudioSession";
import { Badge } from "@/components/ui/badge";
import { NoIndexMeta } from "components/NoIndexMeta";
import { SessionQuery } from "utils/session/query";

export default function Sessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUserGuardContext();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const fetchSessions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Try backend API first
      const response = await brain.list_sessions({ limit: 100, offset: 0 });
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
        setIsLoading(false);
        return; // Success, exit early
      } else {
        const errorText = await response.text().catch(() => response.statusText);
        console.warn("Backend API failed, trying Firestore directly:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        // Fall through to try Firestore directly
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Unknown error";
      console.warn("Backend API error, trying Firestore directly:", errorMessage);
      // Check if it's a network error (backend not running)
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError") || err?.name === "TypeError") {
        console.log("Backend appears to be unavailable, trying Firestore directly...");
        // Fall through to try Firestore directly
      } else {
        // For other errors, still try Firestore as fallback
        console.log("Trying Firestore as fallback...");
      }
    }

    // Fallback: Try querying Firestore directly
    try {
      console.log("Querying Firestore directly for sessions...");
      const firestoreResult = await SessionQuery.listSessions({
        limit: 100,
        offset: 0,
        sortBy: "created_at",
        sortOrder: "desc"
      });
      setSessions(firestoreResult.sessions || []);
      console.log(`Successfully loaded ${firestoreResult.sessions?.length || 0} sessions from Firestore`);
      // Clear any previous error since we succeeded with Firestore
      setError(null);
    } catch (firestoreErr: any) {
      console.error("Firestore direct query also failed:", firestoreErr);
      const errorMessage = firestoreErr?.message || "Unknown error";
      setError(`Cannot fetch sessions. Backend API failed and Firestore direct query also failed: ${errorMessage}. Please ensure the backend server is running on port 8000 and Firebase is properly configured.`);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSessions();
  }, []);

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshSessions = () => {
    if (!isOffline) {
      fetchSessions();
    } else {
      toast.info("Cannot refresh while offline.");
    }
  };

  const [filters, setFilters] = useState<SessionFilterState>({
    search: '',
    client: '',
    project: '',
    tags: [],
    hasNotes: null
  });

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      if (filters.search && !session.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.client && (!session.client_name || !session.client_name.toLowerCase().includes(filters.client.toLowerCase()))) return false;
      if (filters.project && (!session.project_name || !session.project_name.toLowerCase().includes(filters.project.toLowerCase()))) return false;
      if (filters.tags.length > 0) {
        if (!session.tags || !Array.isArray(session.tags)) return false;
        const hasTag = filters.tags.some(filterTag => session.tags?.some(sessionTag => sessionTag.toLowerCase().includes(filterTag.toLowerCase())));
        if (!hasTag) return false;
      }
      return true;
    });
  }, [sessions, filters]);

  const handleViewSession = (sessionId: string) => {
    navigate(`/session-detail?sessionId=${sessionId}`);
  };

  return (
    <ProtectedRoute>
      <NoIndexMeta />
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 sm:py-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-bold">Meeting Sessions</h1>
                {isOffline && (
                  <div className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs">
                    <WifiOff className="h-3 w-3 mr-1" /> Offline
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                {isOffline ? (
                  <Button variant="outline" size="sm" disabled className="flex items-center gap-1">
                    <RefreshCw className="h-3.5 w-3.5 mr-1" /> Offline - Cannot Refresh
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={refreshSessions} disabled={isLoading || isOffline} className="flex items-center gap-1">
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} /> {isLoading ? "Refreshing..." : "Refresh"}
                  </Button>
                )}
                <Button onClick={() => navigate("/transcribe")}>New Transcription</Button>
              </div>
            </div>

            {isOffline && (
              <div className="mb-6 p-4 border rounded-lg bg-yellow-50 text-yellow-800 flex items-center gap-2">
                <WifiOff className="h-5 w-5" />
                <div>
                  <p className="font-medium">You're currently offline</p>
                  <p className="text-sm">Showing cached sessions. Some features may be limited until you reconnect.</p>
                </div>
              </div>
            )}

            <div className="mb-6">
              <MigrationManager />
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid grid-cols-4 w-full sm:w-[550px] mb-4 sm:mb-6">
                <TabsTrigger value="all">All Sessions</TabsTrigger>
                <TabsTrigger value="with-documents">With Documents</TabsTrigger>
                <TabsTrigger value="with-audio">
                  <span className="flex items-center gap-1">
                    <Headphones className="h-4 w-4" />
                    With Audio
                  </span>
                </TabsTrigger>
                <TabsTrigger value="upload">
                  <span className="flex items-center gap-1">
                    <Upload className="h-4 w-4" />
                    Upload Audio/Video
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                <SessionFilters onFilterChange={setFilters} filters={filters} />
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {[...Array(4)].map((_, i) => (
                      <Card key={i} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <Skeleton className="h-5 sm:h-6 w-4/5 mb-2" />
                          <Skeleton className="h-3 sm:h-4 w-1/3" />
                        </CardHeader>
                        <CardContent className="pb-3">
                          <Skeleton className="h-12 sm:h-16 w-full" />
                        </CardContent>
                        <CardFooter>
                          <Skeleton className="h-8 w-full" />
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : error ? (
                  <Card className="bg-red-50">
                    <CardContent className="pt-6">
                      <div className="text-center text-red-600">
                        <p className="font-medium">{error}</p>
                        <Button variant="outline" className="mt-4" onClick={refreshSessions}>Try Again</Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : filteredSessions.length === 0 ? (
                  <Card className="bg-muted/40">
                    <CardContent className="pt-6 pb-6 sm:pb-8">
                      <div className="text-center">
                        <h3 className="text-lg sm:text-xl font-medium mb-2">No sessions yet</h3>
                        <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">Start transcribing your first meeting to create a session.</p>
                        <Button onClick={() => navigate("/transcribe")}>Start Transcribing</Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSessions.map((session) => (
                      <Card key={session.id} className="overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex justify-between">
                            <span className="truncate mr-2">{session.title}</span>
                            {session.has_documents && (
                              <span className="text-xs bg-blue-100 text-blue-800 py-1 px-2 rounded-full">Has Documents</span>
                            )}
                          </CardTitle>
                          <CardDescription>{formatUnixTimestamp(session.created_at)}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-3">
                          <div className="text-sm text-muted-foreground">
                            {session.speakers_count && (<div>Speakers: {session.speakers_count}</div>)}
                            {session.duration && session.duration > 0 ? (
                              <div className="flex items-center text-sm text-green-600"><Clock className="h-3 w-3 mr-1" /><span>Duration: {formatTime(session.duration)}</span></div>
                            ) : (
                              <div className="flex items-center text-sm text-gray-500"><Clock className="h-3 w-3 mr-1" /><span>Processing...</span></div>
                            )}
                            {session.client_name && (<div className="mt-2 flex items-center text-sm text-blue-600"><Users className="h-3 w-3 mr-1" /><span>Client: {session.client_name}</span></div>)}
                            {session.project_name && (<div className="flex items-center text-sm text-emerald-600"><FileEdit className="h-3 w-3 mr-1" /><span>Project: {session.project_name}</span></div>)}
                            {session.meeting_purpose && (<div className="flex items-center text-sm text-purple-600"><FileText className="h-3 w-3 mr-1" /><span>Purpose: {session.meeting_purpose}</span></div>)}
                            {session.metadata?.timeSpent && session.metadata.timeSpent > 0 && (<div className="flex items-center text-sm text-amber-600"><Clock className="h-3 w-3 mr-1" /><span>Time spent: {session.metadata.timeSpent} min</span></div>)}
                            {session.tags && session.tags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {session.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs flex items-center gap-1"><Tag className="h-2 w-2" />{tag}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button variant="outline" className="w-full" onClick={() => handleViewSession(session.id)}>View Details</Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="with-documents" className="mt-0">
                <SessionFilters onFilterChange={setFilters} filters={filters} />
                {!isLoading && !error && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSessions
                      .filter(session => session.has_documents)
                      .map((session) => (
                        <Card key={session.id} className="overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
                          <CardHeader className="pb-2">
                            <CardTitle className="flex justify-between">
                              <span className="truncate mr-2">{session.title}</span>
                              <span className="text-xs bg-blue-100 text-blue-800 py-1 px-2 rounded-full">Has Documents</span>
                            </CardTitle>
                            <CardDescription>{formatUnixTimestamp(session.created_at)}</CardDescription>
                          </CardHeader>
                          <CardContent className="pb-3">
                            <div className="text-sm text-muted-foreground">
                              {session.duration && (
                                <div className="flex items-center text-sm text-green-600 mb-1"><Clock className="h-3 w-3 mr-1" /><span>Duration: {formatTime(session.duration)}</span></div>
                              )}
                              {session.speakers_count && (<div>Speakers: {session.speakers_count}</div>)}
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button variant="outline" className="w-full" onClick={() => handleViewSession(session.id)}>View Details</Button>
                          </CardFooter>
                        </Card>
                      ))}
                  </div>
                )}
                {!isLoading && !error && filteredSessions.filter(s => s.has_documents).length === 0 && (
                  <Card className="bg-muted/40">
                    <CardContent className="pt-6 pb-6 sm:pb-8">
                      <div className="text-center">
                        <h3 className="text-lg sm:text-xl font-medium mb-2">No sessions with documents</h3>
                        <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">Add documents to your sessions to see them here.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="with-audio" className="mt-0">
                <SessionFilters onFilterChange={setFilters} filters={filters} />
                {!isLoading && !error && (
                  <div className="space-y-6">
                    {filteredSessions.filter(session => session.audio_key).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        {filteredSessions
                          .filter(session => session.audio_key && session.id)
                          .map((session) => (
                            <Card key={session.id} className="overflow-hidden">
                              <CardHeader className="pb-2">
                                <CardTitle className="flex justify-between"><span className="truncate mr-2">{session.title}</span></CardTitle>
                                <CardDescription>{formatUnixTimestamp(session.created_at)}</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <SessionAudioPlayer sessionId={session.id} sessionDuration={session.duration} />
                              </CardContent>
                              <CardFooter className="flex justify-between">
                                <Button variant="outline" className="w-full" onClick={() => handleViewSession(session.id)}>View Full Session Details</Button>
                              </CardFooter>
                            </Card>
                          ))}
                      </div>
                    ) : (
                      <Card className="bg-muted/40">
                        <CardContent className="pt-6 pb-6 sm:pb-8">
                          <div className="text-center">
                            <h3 className="text-lg sm:text-xl font-medium mb-2">No session recordings available</h3>
                            <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">Start recording your meetings to have audio playback available.</p>
                            <Button onClick={() => navigate("/transcribe")}>Start Transcribing</Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upload" className="mt-0">
                <UploadAudioSession />
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <footer className="py-8 border-t">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:justify-between items-center">
              <div className="mb-4 md:mb-0">
                <span className="font-semibold">Dicta-Notes</span> © {new Date().getFullYear()}
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2">
                <span onClick={() => navigate('/Privacy')} className="text-muted-foreground hover:text-foreground cursor-pointer">Privacy</span>
                <span onClick={() => navigate('/Terms')} className="text-muted-foreground hover:text-foreground cursor-pointer">Terms</span>
                <span onClick={() => navigate('/CookiePolicy')} className="text-muted-foreground hover:text-foreground cursor-pointer">Cookie Policy</span>
                <span onClick={() => navigate('/CookieSettings')} className="text-muted-foreground hover:text-foreground cursor-pointer">Cookie Settings</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
