import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LiveTranscription } from "components/LiveTranscription";
import { CreateEmptySession } from "components/CreateEmptySession";
import { ShareableSessionDropdown } from "components/ShareableSessionDropdown";
import { useUserProfile } from "utils/userProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, User, Briefcase, Tags as TagsIcon, Clock, X, Plus, Building2, Info, Mic, Monitor } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ModuleStatusPanel } from "components/ModuleStatusPanel";
import { ModuleStatusIndicators } from "components/ModuleStatusIndicators";
import { TranscriptionDisplay } from "components/TranscriptionDisplay";
import { Header } from "components/Header";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";
import { SEOMetaTags, seoConfigs } from "components/SEOMetaTags";
import { NoIndexMeta } from "components/NoIndexMeta";
import { DualRecordingController } from "components/DualRecordingController";
import { AudioPreview } from "components/AudioPreview";
import { AudioSourceType } from "utils/recording/audioSourceTypes";
import { detectBrowserCapabilities, getCapabilityWarning } from "utils/recording/browserCapabilities";
import { ProtectedRoute } from "components/ProtectedRoute";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Company } from "../utils/company/types";
import { CompanyRepository } from "../utils/company";
import { CompanyValidator } from "../utils/CompanyValidator";
import { toast } from "sonner";
import { clearAllTranscriptionData } from "utils/clearTranscriptionData";
import { mode, Mode } from "app";
import SavingSpinner from "components/SavingSpinner";
import { useSessionStore } from "utils/stores/sessionStore";
import { useTranscribeForm } from "utils/useTranscribeForm";
import { TranscribeCompanySection } from "components/TranscribeCompanySection";
import { MeetingMetadataForm } from "components/MeetingMetadataForm";
import { useFastQuotaGuard } from "utils/useFastQuotaGuard";
import { useRecordingNavigationGuard } from "utils/useRecordingNavigationGuard";
import { RecordingLeaveDialog } from "components/RecordingLeaveDialog";

export default function Transcribe() {
  // Use the form hook
  const form = useTranscribeForm();
  
  // Session and app state
  const { isSaving } = useSessionStore();
  const { profile, loading: profileLoading, error: profileError } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Beta quota management - simplified with fast hook
  const quota = useFastQuotaGuard();
  
  // Mobile recording warning
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const mobileWarningResolveRef = useRef<((value: boolean) => void) | null>(null);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const beforeRecordingStartWithMobileCheck = useCallback(async (): Promise<boolean> => {
    if (isMobile && !localStorage.getItem('mobile_recording_tip_seen')) {
      const confirmed = await new Promise<boolean>((resolve) => {
        mobileWarningResolveRef.current = resolve;
        setShowMobileWarning(true);
      });
      if (!confirmed) return false;
    }
    return quota.actions.checkBeforeRecording();
  }, [isMobile, quota.actions.checkBeforeRecording]);

  // Non-form state - MUST BE BEFORE navigation guard since guard needs isRecording
  const [showModuleStatus, setShowModuleStatus] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [sessionSaved, setSessionSaved] = useState<boolean>(false);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("transcription");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  // Navigation guard - block internal navigation when recording is active
  const navigationGuard = useRecordingNavigationGuard({
    isRecording: isRecording,
    onBlock: () => {
      console.log('🚧 Navigation blocked - user is recording');
    },
  });
  
  // Company context
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loadingCompany, setLoadingCompany] = useState<boolean>(false);
  
  // Handler for company changes from TranscribeCompanySection
  const handleCompanyChange = useCallback((newCompanyId: string | null, newCompany: Company | null) => {
    setCompanyId(newCompanyId);
    setCompany(newCompany);
  }, []);

  // Language and audio preferences
  const [languagePreference, setLanguagePreference] = useState<string>('en-US');
  const [vadStream, setVadStream] = useState<MediaStream | null>(null);
  
  // Reference to LiveTranscription component
  const liveTranscriptionRef = useRef<{
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<void>;
    isRecording: boolean;
    isProcessing: boolean;
  } | null>(null);

  // Enhanced Audio Capture State
  const [audioSource, setAudioSource] = useState<AudioSourceType>(() => {
    const saved = localStorage.getItem('dicta_audioSource');
    return saved !== null ? saved as AudioSourceType : AudioSourceType.MICROPHONE;
  });
  const [browserWarning, setBrowserWarning] = useState<string | null>(null);

  // Browser capability check on mount
  useEffect(() => {
    const checkCapabilities = async () => {
      const capabilities = await detectBrowserCapabilities();
      const warning = getCapabilityWarning(capabilities);
      setBrowserWarning(warning);
    };
    checkCapabilities();
  }, []);

  // NEW: Callback to clear all input fields when Clear Screen is clicked
  const handleClearAllInputs = useCallback(() => {
    console.log('🧹 Clearing all input fields to provide clean slate');
    
    // Clear form data using the hook
    form.clearForm();
    setTranscript('');
    
    // Reset session-related state
    setSessionSaved(false);
    setSavedSessionId(null);
    
    // Reset active tab to transcription
    setActiveTab('transcription');
    
    console.log('✅ All input fields cleared - providing clean slate');
  }, [form]);

  // NEW: Complete clear function that clears both transcription data and input fields
  const handleCompleteScreenClear = useCallback(() => {
    console.log('🧹 Starting complete screen clear (transcription + input fields)');
    
    // First clear all input fields
    handleClearAllInputs();
    
    // Then find and click the existing Clear Screen button in the transcription area
    setTimeout(() => {
      const clearButtons = Array.from(document.querySelectorAll('button')).filter(
        button => button.textContent?.trim() === 'Clear Screen'
      );
      
      const transcriptionClearButton = clearButtons.find(button => {
        const buttonRect = button.getBoundingClientRect();
        return buttonRect.top > 400;
      });
      
      if (transcriptionClearButton) {
        console.log('🧹 Found transcription Clear Screen button, clicking it');
        transcriptionClearButton.click();
      } else {
        console.log('🧹 Transcription Clear Screen button not found');
        clearAllTranscriptionData({
          sessionId: savedSessionId,
          clearTranscription: () => setTranscript(''),
          setSessionId: (id: string) => setSavedSessionId(id),
          onClearAll: () => {}
        });
      }
    }, 100);
  }, [savedSessionId, handleClearAllInputs]);

  // NEW: Check if any form fields have content to determine button visibility
  const hasFormData = useCallback(() => {
    return (
      form.meetingTitle.trim() !== '' ||
      form.meetingPurpose.trim() !== '' ||
      form.participants.length > 0 ||
      form.clientName.trim() !== '' ||
      form.projectName.trim() !== '' ||
      form.tags.length > 0 ||
      form.notes.trim() !== '' ||
      form.timeSpent > 0 ||
      transcript.trim() !== '' ||
      sessionSaved ||
      form.selectedShareableSessionId !== null
    );
  }, [form, transcript, sessionSaved]);

  // Handle shareable session selection
  const handleSessionSelect = (sessionId: string, sessionTitle: string) => {
    form.setSelectedShareableSessionId(sessionId);
    // Optionally update meeting title if not already set
    if (!form.meetingTitle.trim()) {
      form.setMeetingTitle(sessionTitle);
    }
  };

  // Handle transcript updates from LiveTranscription component
  const handleTranscriptUpdate = useCallback((newTranscript: string) => {
    setTranscript(newTranscript);
  }, []);

  // Check for saved session ID on mount
  useEffect(() => {
    const sessionId = sessionStorage.getItem('lastSavedSessionId');
    if (sessionId) {
      setSavedSessionId(sessionId);
      setSessionSaved(true);
    }
    
    // Clear the session ID from storage when the component is unmounted
    return () => {
      sessionStorage.removeItem('lastSavedSessionId');
    };
  }, []);

  return (
    <ProtectedRoute>
      <SEOMetaTags {...seoConfigs.transcribe} />
      <NoIndexMeta />
      <Helmet>
        <title>Live Meeting Transcription | Dicta-Notes</title>
        <meta name="description" content="Record, transcribe, and manage your meetings in real-time with Dicta-Notes. Features AI-powered speaker identification and seamless session management." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://dicta-notes.com/transcribe#webpage",
            "url": "https://dicta-notes.com/transcribe",
            "name": "Live Meeting Transcription | Dicta-Notes",
            "description": "How do I record and transcribe a meeting? Use Dicta-Notes to record, transcribe, and manage your meetings in real-time with AI-powered speaker identification and seamless session management.",
            "isPartOf": {
              "@type": "WebSite",
              "@id": "https://dicta-notes.com/#website",
              "url": "https://dicta-notes.com",
              "name": "Dicta-Notes"
            },
            "mainEntity": {
              "@type": "SoftwareApplication",
              "@id": "https://dicta-notes.com/#software",
              "name": "Dicta-Notes",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": "https://dicta-notes.com/transcribe#webpage"
            },
            "relatedLink": [
              "https://dicta-notes.com/instructions",
              "https://dicta-notes.com/ai-benefits",
              "https://dicta-notes.com/install"
            ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "How to Record and Transcribe a Meeting",
            "description": "Step-by-step guide to recording and transcribing meetings with AI speaker identification using Dicta-Notes.",
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": "https://dicta-notes.com/transcribe#webpage"
            },
            "step": [
              {
                "@type": "HowToStep",
                "name": "Set Up Meeting Details",
                "text": "Enter your meeting title, purpose, and add participant names for better speaker identification."
              },
              {
                "@type": "HowToStep",
                "name": "Start Recording",
                "text": "Click the Start Recording button and grant microphone permissions when prompted."
              },
              {
                "@type": "HowToStep",
                "name": "Monitor Transcription",
                "text": "Watch as the AI transcribes your conversation in real-time with automatic speaker identification."
              },
              {
                "@type": "HowToStep",
                "name": "Add Notes",
                "text": "Switch to the Notes tab to add your own professional notes alongside the transcription."
              },
              {
                "@type": "HowToStep",
                "name": "Save and Share",
                "text": "When finished, save your session to access it later or share with team members."
              }
            ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://dicta-notes.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Live Transcription",
                "item": "https://dicta-notes.com/transcribe"
              }
            ]
          })}
        </script>
      </Helmet>
      <div className="flex flex-col min-h-screen" itemScope itemType="https://schema.org/WebPage" itemID="https://dicta-notes.com/transcribe#webpage">
        {isSaving && <SavingSpinner />} 
        <Header />

        {/* Speaker timeline warning dialog */}
      <Dialog open={form.showSpeakerWarning} onOpenChange={(open) => {
        if (!open) {
          form.setPendingParticipant('');
        }
        form.setShowSpeakerWarning(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info size={18} className="text-amber-500" />
              Speaker Timeline Tip
            </DialogTitle>
            <DialogDescription>
              For best results, only add participants when they're currently speaking. This helps Gemini associate voices with names more accurately.
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800">
                <strong>Recommendation:</strong> Add the current speaker now, then <em>click on</em> a participant's badge during recording whenever that person starts speaking.
              </div>
              <div className="mt-2 bg-blue-50 p-2 rounded border border-blue-100 text-blue-800">
                <strong>How it works:</strong> Each time you click a badge, we record a timestamp. This creates a speaker timeline that helps Gemini accurately identify each voice.
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={form.cancelAddParticipant}>Cancel</Button>
            <Button onClick={form.confirmAddParticipant}>Add Participant</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Recording navigation guard dialog */}
      <RecordingLeaveDialog
        open={navigationGuard.isBlocked}
        onCancel={navigationGuard.reset}
        onContinue={navigationGuard.proceed}
      />
        
        <main className="flex-1 container mx-auto px-4 py-8 sm:py-10" itemScope itemType="https://schema.org/HowTo">
          <div className="max-w-6xl mx-auto" itemProp="mainContentOfPage">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center" itemProp="name">Live Meeting Transcription</h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed max-w-4xl mx-auto text-center" itemProp="description">
              Record and transcribe your meetings in real-time with AI-powered speaker identification. Perfect for
              businesses, freelancers, and teams of all sizes.
            </p>

            {/* Skip to Recording Button */}
            <div className="text-center mb-8">
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  onClick={() => {
                    const recordingSection = document.querySelector('[data-section="recording-system"]');
                    if (recordingSection) {
                      recordingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                >
                  🎤 Skip to Recording
                </Button>
                
                {/* Only show Clear Screen button when there's data to clear */}
                {hasFormData() && (
                  <Button
                    onClick={handleCompleteScreenClear}
                    variant="outline"
                    size="lg"
                    className="px-8 py-4 text-lg border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Clear Screen
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Jump directly to start recording if you've already set up your meeting details
              </p>
            </div>

            <Tabs defaultValue="transcribe" className="w-full mb-6">
              <TabsList className={`grid w-full ${mode === Mode.DEV ? 'grid-cols-2' : 'grid-cols-1'} mb-8`}>
                <TabsTrigger value="transcribe">Transcribe Meeting</TabsTrigger>
                {mode === Mode.DEV && (
                  <TabsTrigger value="create-link">Create Shareable Link</TabsTrigger>
                )}
              </TabsList>
              <TabsContent value="transcribe">
                
                {/* Meeting Setup Card */}
                <MeetingMetadataForm
                  meetingTitle={form.meetingTitle}
                  setMeetingTitle={form.setMeetingTitle}
                  meetingPurpose={form.meetingPurpose}
                  setMeetingPurpose={form.setMeetingPurpose}
                  clientName={form.clientName}
                  setClientName={form.setClientName}
                  projectName={form.projectName}
                  setProjectName={form.setProjectName}
                  tags={form.tags}
                  setTags={form.setTags}
                  timeSpent={form.timeSpent}
                  increaseTimeSpent={form.increaseTimeSpent}
                  onCompanyChange={handleCompanyChange}
                  showFreelancerFields={!profileLoading && !profileError && profile?.userType === 'freelancer'}
                />
                
                {/* Participants Card */}
                {mode === Mode.DEV && (
                  <Card className="mb-8">
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Participants & Speaker Timeline
                      </h2>
                      
                      {/* Shareable Session Dropdown */}
                      <div className="mb-6">
                        <ShareableSessionDropdown 
                          onSessionSelect={handleSessionSelect}
                          selectedSessionId={form.selectedShareableSessionId}
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground p-3 bg-blue-50 border border-blue-100 rounded-md">
                          <strong>💡 Speaker Timeline Tip:</strong> Add participants and click their badges during recording when they speak. This creates timestamps that help Gemini accurately identify voices.
                        </div>
                        
                        <div className="flex gap-2">
                          <Input
                            value={form.newParticipant}
                            onChange={(e) => form.setNewParticipant(e.target.value)}
                            placeholder="Add participant name while they are speaking"
                            className="flex-1"
                            onKeyDown={form.handleKeyDown}
                          />
                          <Button
                            type="button"
                            onClick={form.handleAddParticipant}
                            disabled={!form.newParticipant.trim()}
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add
                          </Button>
                        </div>
                        
                        {/* Display participant badges */}
                        {form.participants.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {form.participants.map((participant, index) => (
                              <Badge key={index} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                                {participant}
                                <button
                                  onClick={() => {
                                    const newParticipants = [...form.participants];
                                    newParticipants.splice(index, 1);
                                    form.setParticipants(newParticipants);
                                  }}
                                  className="text-muted-foreground hover:text-foreground ml-1 rounded-full"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No participants added yet. Add participant names to track who is speaking during the meeting.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Recording and Notes Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="transcription">🎤 Recording & Transcription</TabsTrigger>
                    <TabsTrigger value="notes">📝 Professional Notes</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="transcription" className="space-y-6">
                    {/* Dual Recording System - Unified Interface */}
                    <Card>
                      <CardContent className="p-6">
                        <div data-section="recording-system">
                          <DualRecordingController
                            meetingTitle={form.meetingTitle}
                            meetingPurpose={form.meetingPurpose}
                            participants={form.participants}
                            companyId={companyId}
                            sessionId={form.selectedShareableSessionId}
                            liveTranscriptionRef={liveTranscriptionRef}
                            onTranscriptUpdate={setTranscript}
                            onParticipantsUpdate={form.setParticipants}
                            audioSource={audioSource}
                            languagePreference={languagePreference}
                            onRecordingStateChange={(recording) => {
                              setIsRecording(recording);
                              if (recording) setAudioBlob(null);
                            }}
                            onProcessingStateChange={setIsProcessing}
                            beforeRecordingStart={beforeRecordingStartWithMobileCheck}
                            onRecordingComplete={quota.actions.trackUsage}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Audio Player - visible after recording */}
                    {audioBlob && !isRecording && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-green-600 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse inline-block" />
                              Recording saved on device
                            </span>
                            <button
                              onClick={() => {
                                const a = document.createElement('a');
                                a.href = URL.createObjectURL(audioBlob);
                                a.download = `recording_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.webm`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                toast.success("Download started");
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                            >
                              Download
                            </button>
                          </div>
                          <AudioPreview audioBlob={audioBlob} />
                        </CardContent>
                      </Card>
                    )}

                    {/* Traditional Recording System - Hidden but still available for external control */}
                    <div className="hidden">
                      <LiveTranscription
                        ref={liveTranscriptionRef}
                        meetingTitle={form.meetingTitle}
                        meetingPurpose={form.meetingPurpose}
                        participants={form.participants}
                        companyId={companyId}
                        onTranscriptUpdate={handleTranscriptUpdate}
                        onParticipantsUpdate={form.setParticipants}
                        externallyControlled={true}
                        sessionId={form.selectedShareableSessionId}
                        vadStream={vadStream}
                        clientName={form.clientName}
                        projectName={form.projectName}
                        tags={form.tags}
                        languagePreference={languagePreference}
                        onAudioReady={setAudioBlob}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="notes" className="space-y-4">
                    <Card>
                      <CardContent className="p-6">
                        <div>
                          <Label htmlFor="notes" className="text-lg font-semibold">Professional Notes</Label>
                          <p className="text-sm text-muted-foreground mb-4">
                            Add your own notes during or after the recording. These will be saved with the transcription.
                          </p>
                          <Textarea
                            id="notes"
                            value={form.notes}
                            onChange={(e) => form.setNotes(e.target.value)}
                            placeholder="Add your professional notes here..."
                            className="min-h-[400px] font-medium"
                          />
                        </div>
                        <div className="flex justify-end mt-4">
                          <p className="text-sm text-muted-foreground">
                            Your notes will be automatically saved with the transcript
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </TabsContent>
              <TabsContent value="create-link">
                <div className="max-w-md mx-auto">
                  <CreateEmptySession meetingTitle={form.meetingTitle} companyId={companyId} meetingPurpose={form.meetingPurpose} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 sm:py-8 border-t">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:justify-between items-center">
              <div className="mb-4 sm:mb-0">
                <span className="font-semibold">Dicta-Notes</span> © {new Date().getFullYear()}
              </div>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                <span onClick={() => navigate('/Privacy')} className="text-muted-foreground hover:text-foreground cursor-pointer">Privacy</span>
                <span onClick={() => navigate('/Terms')} className="text-muted-foreground hover:text-foreground cursor-pointer">Terms</span>
                <span onClick={() => navigate('/CookiePolicy')} className="text-muted-foreground hover:text-foreground cursor-pointer">Cookie Policy</span>
                <span onClick={() => navigate('/CookieSettings')} className="text-muted-foreground hover:text-foreground cursor-pointer">Cookie Settings</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
      {/* Mobile recording warning — shown once on first recording attempt */}
      <Dialog open={showMobileWarning} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              📱 Mobile Recording Tip
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-sm text-foreground pt-1">
                <p>
                  For a complete, uninterrupted recording, <strong>keep Dicta-Notes open and in the foreground</strong> for the full duration of your meeting.
                </p>
                <p>
                  On phones and tablets, switching to another app (to check a text, look something up, etc.) will pause audio capture and create a gap in your transcript.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p className="font-medium text-amber-800 mb-1">💡 Tips for mobile recording:</p>
                  <ul className="list-disc pl-4 space-y-1 text-amber-700">
                    <li>Enable Do Not Disturb to block interruptions</li>
                    <li>Keep your screen on and the app visible</li>
                    <li>Use a laptop if you need to multitask</li>
                  </ul>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowMobileWarning(false);
                mobileWarningResolveRef.current?.(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                localStorage.setItem('mobile_recording_tip_seen', 'true');
                setShowMobileWarning(false);
                mobileWarningResolveRef.current?.(true);
              }}
            >
              Got it, start recording
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}
