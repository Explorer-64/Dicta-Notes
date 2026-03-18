import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import brain from "brain";
import { Header } from "components/Header";
import { TranscriptDisplay } from "components/TranscriptDisplay";
import { OnDemandTranscription } from "components/OnDemandTranscription";
import { Company, CompanyRepository } from "utils/company";
import { DocumentDisplay } from "components/DocumentDisplay";
import { MeetingInfoCard } from "components/MeetingInfoCard";
import { DocumentMetadata, Session, Speaker } from "types";
import { ProtectedRoute } from "components/ProtectedRoute";
import { SessionRepository } from "utils/SessionRepository";
import { useUserGuardContext, auth, APP_BASE_PATH } from "app";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CompanyPermissions } from "utils/company/permissions";
import { Trash2, Volume2, FileText, Pencil, Download, Headphones, Users, RefreshCw } from "lucide-react";
import { VerificationDialog } from "components/VerificationDialog";
import { AudioPlayback } from "components/AudioPlayback";
import { NotesTab } from "components/NotesTab";
import { SessionAudioPlayer } from "components/SessionAudioPlayer";
import { SpeakerNameUpdateForm } from "components/SpeakerNameUpdateForm";
import { extractUniqueSpeakers } from "utils/speakerUtils";
import { TierAwareExportButton } from "components/TierAwareExportButton";
import { NoIndexMeta } from "components/NoIndexMeta";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "utils/firebase";
import { Progress } from "@/components/ui/progress";
import { TranslateAllButton } from "components/TranslateAllButton";
import { useLanguageStore } from "utils/languageStore";

export default function SessionDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  
  // Early validation - redirect if no sessionId
  if (!sessionId) {
    console.error('SessionDetail: No sessionId provided in URL');
    navigate('/sessions');
    return null;
  }
  
  const [session, setSession] = useState<Session | null>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [timeSpent, setTimeSpent] = useState<number | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("transcript");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRetranscribing, setIsRetranscribing] = useState(false);
  const [seekRequest, setSeekRequest] = useState<{ time: number; id: number } | null>(null);
  const seekIdRef = useRef(0);
  const [transcriptionStatus, setTranscriptionStatus] = useState<'processing' | 'completed' | 'failed' | null>(null);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const transcriptionListenerRef = useRef<(() => void) | null>(null);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const { user } = useUserGuardContext();
  const { preferredLanguage } = useLanguageStore();
  const [savedTranslation, setSavedTranslation] = useState<{ langCode: string; texts: string[] } | null>(null);

  // Initialize with meeting start time from session
  const [actualStartTime, setActualStartTime] = useState<Date | null>(null);
  const [actualAttendees, setActualAttendees] = useState<string[]>([]);
  
  // Check if user can delete this session
  const checkDeletePermission = async (): Promise<boolean> => {
    if (!session || !user) return false;
    
    try {
      // Check if user is the owner
      if (session.userId === user.uid) {
        return true;
      }
      
      // If it's a company session, check for admin permissions
      if (session.companyId) {
        try {
          // Check if user is company admin
          const isAdmin = await CompanyPermissions.verifyCompanyAdmin(session.companyId);
          return isAdmin;
        } catch (error) {
          console.error("Error checking admin status:", error);
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error checking delete permissions:", error);
      return false;
    }
  };
  
  // Fetch session data
  const fetchSession = async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to fetch from Firestore first if user is authenticated
      if (user) {
        try {
          const firestoreSession = await SessionRepository.getSession(sessionId);
          if (firestoreSession) {
            setSession(firestoreSession);
            setActualStartTime(new Date(firestoreSession.created_at * 1000));
            if (firestoreSession.speakers && firestoreSession.speakers.length > 0) {
              setActualAttendees(firestoreSession.speakers.map((speaker: Speaker) => speaker.name || speaker.id));
            }
            
            // Set notes and time spent if available in metadata
            // Use direct fields if available, otherwise fallback to metadata for backward compatibility?
            // For now, assume direct fields exist from getSession or firestore
            setNotes(firestoreSession.notes || firestoreSession.metadata?.notes || null);
            setTimeSpent(firestoreSession.time_spent || firestoreSession.metadata?.time_spent || null);
            
            setIsLoading(false);
            return;
          }
        } catch (firestoreError) {
          console.log("Firestore fetch failed, falling back to API", firestoreError);
          // Fall through to API fetch below
        }
      }
      
      // Fall back to API fetch if Firestore fails or returns no results
      const response = await brain.get_session({
        session_id: sessionId
      });
      
      if (response.ok) {
        const data = await response.json();
        setSession(data);
        
        // Initialize actual start time and attendees
        setActualStartTime(new Date(data.created_at * 1000));
        if (data.speakers && data.speakers.length > 0) {
          setActualAttendees(data.speakers.map((speaker: Speaker) => speaker.name || speaker.id));
        }
        
        // Set notes and time spent if available
        // Use direct fields if available, otherwise fallback to metadata?
        setNotes(data.notes || data.metadata?.notes || null);
        setTimeSpent(data.time_spent || data.metadata?.time_spent || null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch session");
      }
    } catch (error) {
      console.error("Error fetching session:", error);
      setError("Failed to load session details. Please try again.");
      toast.error("Failed to load session details");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load session on component mount
  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  // Load saved translation for the user's preferred language
  useEffect(() => {
    if (!sessionId || !preferredLanguage) return;
    const langCode = preferredLanguage.split('-')[0];
    getDoc(doc(db, `sessions/${sessionId}/translations/${langCode}`))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setSavedTranslation({ langCode, texts: data.texts as string[] });
        }
      })
      .catch(() => {
        // silently ignore — translation just won't auto-load
      });
  }, [sessionId, preferredLanguage]);
  
  // Load company information if session has companyId
  useEffect(() => {
    const loadCompanyData = async () => {
      if (session?.companyId) {
        try {
          const companyData = await CompanyRepository.getCompany(session.companyId);
          setCompany(companyData);
        } catch (error) {
          console.error("Error loading company data:", error);
          setCompany(null);
        }
      }
    };
    
    loadCompanyData();
  }, [session]);
  
  // Effect to recheck permissions when session or user changes
  useEffect(() => {
    // We no longer need this effect since we check permissions on-demand
  }, [session, user]);
  
  const openVerificationDialog = async () => {
    // No longer need to check permission first since the verification dialog
    // will handle both authorized and unauthorized users
    setVerificationDialogOpen(true);
  };
  
  // Handle session deletion after verification
  const handleDeleteSession = async () => {
    if (!sessionId || isDeleting) return; // Add isDeleting guard
    
    setIsDeleting(true);
    
    try {
      // Use brain client for deletion
      const response = await brain.delete_session(
        { sessionId }, 
        { verification: { requireVerification: true } }
      );
      
      if (response.ok) {
        toast.success("Session deleted successfully");
        navigate("/sessions");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete session");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleRetranscribe = async () => {
    if (!sessionId || isRetranscribing) return;
    setIsRetranscribing(true);
    setTranscriptionProgress(0);
    try {
      const response = await brain.initiate_on_demand_transcription(sessionId, session?.duration ?? null);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to start retranscription");
      }
      // Job queued — set up Firestore listener to track progress
      setTranscriptionStatus('processing');
      setTranscriptionProgress(10);
      const sessionRef = doc(db, 'sessions', sessionId);
      // Clean up any previous listener
      if (transcriptionListenerRef.current) transcriptionListenerRef.current();
      let progressInterval: ReturnType<typeof setInterval> | null = null;
      const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
        if (!snapshot.exists()) return;
        const status = snapshot.data().transcription_status as string | undefined;
        if (status === 'processing') {
          if (!progressInterval) {
            let p = 10;
            progressInterval = setInterval(() => {
              p += Math.random() * 5;
              if (p >= 90) { p = 90; if (progressInterval) { clearInterval(progressInterval); progressInterval = null; } }
              setTranscriptionProgress(p);
            }, 800);
          }
        } else if (status === 'completed') {
          if (progressInterval) { clearInterval(progressInterval); progressInterval = null; }
          setTranscriptionProgress(100);
          setTranscriptionStatus('completed');
          toast.success('Retranscription complete! Reloading transcript...');
          setTimeout(() => {
            fetchSession();
            setTranscriptionStatus(null);
            setTranscriptionProgress(0);
          }, 1500);
          unsubscribe();
          transcriptionListenerRef.current = null;
        } else if (status === 'failed') {
          if (progressInterval) { clearInterval(progressInterval); progressInterval = null; }
          const errorMsg = snapshot.data().transcription_error || 'Transcription failed.';
          setTranscriptionStatus('failed');
          setTranscriptionProgress(0);
          toast.error(`Retranscription failed: ${errorMsg}`);
          unsubscribe();
          transcriptionListenerRef.current = null;
        }
      });
      transcriptionListenerRef.current = () => {
        if (progressInterval) clearInterval(progressInterval);
        unsubscribe();
      };
    } catch (error) {
      console.error("Error starting retranscription:", error);
      toast.error("Failed to start retranscription. Please try again.");
      setTranscriptionStatus(null);
    } finally {
      setIsRetranscribing(false);
    }
  };

  // Cleanup Firestore listener on unmount
  useEffect(() => {
    return () => { if (transcriptionListenerRef.current) transcriptionListenerRef.current(); };
  }, []);

  const handleSeekFromTranscript = (time: number) => {
    setActiveTab('audio');
    seekIdRef.current += 1;
    setSeekRequest({ time, id: seekIdRef.current });
  };

  // Handle notes updated
  const handleNotesUpdated = (updatedNotes: string, updatedTimeSpent: number) => {
    setNotes(updatedNotes);
    setTimeSpent(updatedTimeSpent);
    
    // Update session state directly if needed
    if (session) {
      setSession({
        ...session,
        notes: updatedNotes, // Update direct field
        time_spent: updatedTimeSpent // Update direct field
        // Keep metadata update for potential backward compatibility or remove if not needed
        // metadata: {
        //   ...session.metadata,
        //   notes: updatedNotes,
        //   time_spent: updatedTimeSpent
        // }
      });
    }
  };
  
  // Handle adding a document
  const handleDocumentAdded = async (documentId: string, metadata: DocumentMetadata) => {
    // Try to add document to Firestore first
    if (user && sessionId && session) {
      try {
        const documentData = {
          document_data: documentId, // This would be the base64 content or document reference
          document_type: metadata.document_type || null
        };
        
        await SessionRepository.addDocument(sessionId, documentData);
        // If successful, refresh the session
        fetchSession();
        setActiveTab("documents");
        return;
      } catch (error) {
        console.error("Error adding document to Firestore:", error);
        // Fall through to API approach
      }
    }
    
    // Fall back to API approach
    fetchSession();
    setActiveTab("documents");
  };
  
  // Find document with agenda metadata
  const getAgendaDocument = () => {
    if (!session?.documents) return null;
    
    return session.documents.find(doc => 
      doc.metadata?.document_type === 'agenda' || 
      (doc.metadata?.title && doc.metadata.title.toLowerCase().includes('agenda'))
    );
  };
  
  const scheduledInfo = getAgendaDocument()?.metadata;

  // Handle speaker names updated
  const handleSpeakerNamesUpdated = (updatedSpeakers: Speaker[]) => {
    // Update session state with new speakers
    if (session) {
      setSession({
        ...session,
        speakers: updatedSpeakers
      });
    }
    
    // Switch back to transcript tab to show updated names
    setActiveTab("transcript");
    
    // Refresh session data to get the updated transcript
    fetchSession();
  };

  return (
    <ProtectedRoute>
      <NoIndexMeta />
      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Back button and title */}
            <div className="mb-6">
              {isLoading ? (
                <Skeleton className="h-8 w-1/2" />
              ) : (
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold">{session?.title || "Session Details"}</h1>
                  {session && <TierAwareExportButton session={session} companyName={company?.name} />}
                </div>
              )}
              
              {!isLoading && session && (
                <div className="text-muted-foreground mt-1">
                  {format(new Date(session.created_at * 1000), "PPP 'at' p")}
                </div>
              )}
            </div>
            
            {isLoading ? (
              // Loading skeleton
              <div className="space-y-6">
                <Skeleton className="h-[500px] w-full" />
              </div>
            ) : error ? (
              // Error state
              <Card className="bg-red-50">
                <CardContent className="pt-6">
                  <div className="text-center text-red-600">
                    <p className="font-medium">{error}</p>
                    <Button 
                      variant="outline" 
                      className="mt-4" 
                      onClick={fetchSession}
                    >
                      Try Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : session ? (
              // Session content
              <div className="space-y-6">
                {/* Meeting Information */}
                {scheduledInfo && actualStartTime && (
                  <MeetingInfoCard 
                    actualStartTime={actualStartTime}
                    actualAttendees={actualAttendees}
                    scheduledInfo={scheduledInfo}
                    meetingPurpose={session?.metadata?.meetingPurpose}
                  />
                )}
                
                {/* Main content tabs */}
                <Tabs defaultValue="transcript" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-5 gap-1 h-auto">
                    <TabsTrigger value="transcript" className="text-xs md:text-sm px-1 md:px-3 py-2">
                     <span className="flex items-center gap-1">
                       <FileText className="h-3 w-3 md:h-4 md:w-4" />
                       <span className="hidden sm:inline">Transcript</span>
                       <span className="sm:hidden">Text</span>
                     </span>
                   </TabsTrigger>
                   <TabsTrigger value="notes" className="text-xs md:text-sm px-1 md:px-3 py-2">
                     <span className="flex items-center gap-1">
                       <Pencil className="h-3 w-3 md:h-4 md:w-4" />
                       <span className="hidden sm:inline">Notes</span>
                       <span className="sm:hidden">Notes</span>
                     </span>
                   </TabsTrigger>
                   <TabsTrigger value="documents" className="text-xs md:text-sm px-1 md:px-3 py-2">
                     <span className="flex items-center gap-1">
                       <FileText className="h-3 w-3 md:h-4 md:w-4" />
                       <span className="hidden sm:inline">Documents</span>
                       <span className="sm:hidden">Docs</span>
                     </span>
                   </TabsTrigger>
                   <TabsTrigger value="audio" className="text-xs md:text-sm px-1 md:px-3 py-2">
                     <span className="flex items-center gap-1">
                       <Headphones className="h-3 w-3 md:h-4 md:w-4" />
                       <span className="hidden sm:inline">Audio</span>
                       <span className="sm:hidden">Audio</span>
                     </span>
                   </TabsTrigger>
                   <TabsTrigger value="speakers" className="text-xs md:text-sm px-1 md:px-3 py-2">
                     <span className="flex items-center gap-1">
                       <Users className="h-3 w-3 md:h-4 md:w-4" />
                       <span className="hidden sm:inline">Edit Speakers</span>
                       <span className="sm:hidden">Edit</span>
                     </span>
                   </TabsTrigger>
                 </TabsList>
                  
                  {/* Transcript tab */}
                   <TabsContent value="transcript" className="mt-4">
                      {session && (session.full_text || session.transcript_data?.full_text) ? (
                        <>
                          {(session?.segments || session?.transcript_data?.segments)?.length > 0 && (
                            <TranslateAllButton
                              sessionId={sessionId}
                              existingTranslation={savedTranslation}
                              onTranslationSaved={(langCode, texts) => setSavedTranslation({ langCode, texts })}
                            />
                          )}
                          <TranscriptDisplay
                            fullText={session.full_text || session.transcript_data?.full_text}
                            title={session?.title || "Untitled Session"}
                            createdAt={session?.created_at || 0}
                            speakers={session?.speakers || session?.transcript_data?.speakers}
                            segments={session?.segments || session?.transcript_data?.segments}
                            meetingPurpose={session?.meetingPurpose || session?.metadata?.meetingPurpose}
                            company={company}
                            clientName={session?.client_name || session?.metadata?.client_name}
                            projectName={session?.project_name || session?.metadata?.project_name}
                            notes={notes}
                            sessionId={sessionId}
                            sessionUserId={user?.uid}
                            onSeekRequest={handleSeekFromTranscript}
                            savedTranslation={savedTranslation}
                          />
                        </>
                      ) : (
                        <OnDemandTranscription
                          sessionId={sessionId}
                          onTranscriptionComplete={() => {
                            // Reload session data after transcription completes
                            fetchSession();
                          }}
                        />
                      )}
                   </TabsContent>
                  
                  {/* Audio tab */}
                  <TabsContent value="audio" className="mt-4">
                    {session ? (
                      <SessionAudioPlayer
                        sessionId={session?.id || ""}
                        useUnifiedTimer={true}
                        sessionDuration={session?.duration}
                        seekRequest={seekRequest} />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Session data not available
                      </div>
                    )}
                  </TabsContent>
                  {/* Notes tab */}
                  <TabsContent value="notes" className="mt-4">
                    {session ? (
                      <NotesTab
                        sessionId={session?.id || ""}
                        notes={notes}
                        timeSpent={timeSpent}
                        onNotesUpdated={handleNotesUpdated}
                        clientName={session?.client_name || session?.metadata?.client_name} // Check both
                        projectName={session?.project_name || session?.metadata?.project_name} // Check both
                        sessionTitle={session?.title || "Untitled Session"}
                        sessionDuration={session?.duration}
                        sessionStartTime={actualStartTime}
                      />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Session data not available
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Documents tab */}
                  <TabsContent value="documents" className="mt-4">
                    {session ? (
                      <DocumentDisplay 
                        sessionId={session?.id || ""}
                        documents={session?.documents}
                        onDocumentAdded={handleDocumentAdded}
                      />
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Session data not available
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Edit Speakers tab */}
                  <TabsContent value="speakers" className="mt-4">
                    {/* Only render if we have both sessionId and session loaded */}
                    {sessionId && session ? (
                      <SpeakerNameUpdateForm
                        sessionId={sessionId}
                        speakers={extractUniqueSpeakers(session?.speakers, session?.segments)}
                        onSuccess={handleSpeakerNamesUpdated}
                        onError={(error) => {
                          console.error('Speaker update error:', error);
                          toast.error('Failed to update speaker names');
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-muted-foreground">Loading speaker data...</div>
                      </div>
                    )}
                  </TabsContent>
                 
                </Tabs>

                {/* Retranscription progress banner */}
                {transcriptionStatus === 'processing' && (
                  <div className="mt-6 p-4 rounded-lg border bg-blue-50 border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Retranscription in progress...</span>
                    </div>
                    <Progress value={transcriptionProgress} className="h-2 mb-1" />
                    <p className="text-xs text-blue-600">{Math.round(transcriptionProgress)}% — The transcript will reload automatically when complete</p>
                  </div>
                )}
                {transcriptionStatus === 'completed' && (
                  <div className="mt-6 p-4 rounded-lg border bg-green-50 border-green-200">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Retranscription complete! Reloading...</span>
                    </div>
                  </div>
                )}
                {transcriptionStatus === 'failed' && (
                  <div className="mt-6 p-4 rounded-lg border bg-red-50 border-red-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-red-800">Retranscription failed. Please try again.</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-8 border-t pt-6 flex items-center space-x-3">
                  {/* Export Button */}
                  
                  {/* Retranscribe Button */}
                  <Button variant="outline" disabled={isRetranscribing} className="gap-2" onClick={handleRetranscribe}>
                    <RefreshCw className={`h-4 w-4 ${isRetranscribing ? "animate-spin" : ""}`} />
                    {isRetranscribing ? "Starting..." : "Retranscribe"}
                  </Button>

                  {/* Delete Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={isDeleting} className="gap-2" onClick={openVerificationDialog}>
                        <Trash2 className="h-4 w-4" />
                        {isDeleting ? "Deleting..." : "Delete Session"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent aria-describedby="alert-dialog-description">
                      <AlertDialogHeader>
                        <AlertDialogTitle id="alert-dialog-title">Warning: Permanent Deletion</AlertDialogTitle>
                        <AlertDialogDescription id="alert-dialog-description" className="space-y-2">
                          <div>
                            You are about to delete a session that may contain legal document records.
                            This action <strong>cannot be undone</strong> and all data will be permanently lost.
                          </div>
                          <div className="text-amber-600 font-medium">
                            Note: Only session owners and company administrators are authorized to delete sessions.
                          </div>
                          <div>
                            By proceeding, you confirm you have the legal authority to delete these records.
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={openVerificationDialog} className="bg-red-600 hover:bg-red-700">
                          I understand, proceed with verification
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Deleting this session will permanently remove all associated data and cannot be recovered.
                </p>
              </div>
            ) : null}
          </div>
        </main>

        {/* Footer */}
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
      
      {/* Verification Dialog for secure deletion */}
      {sessionId && (
        <VerificationDialog
          sessionId={sessionId}
          title={session?.title || 'Untitled Session'}
          isOpen={verificationDialogOpen}
          onClose={() => setVerificationDialogOpen(false)}
          onDelete={handleDeleteSession}
        />
      )}
    </ProtectedRoute>
  );
}
