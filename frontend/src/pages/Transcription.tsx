import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Header } from 'components/Header';
import { useCurrentUser } from 'app';
import { User, Briefcase, Tags as TagsIcon, Clock, Plus, X, Info } from 'lucide-react';
import { toast } from 'sonner';
import { NoIndexMeta } from "components/NoIndexMeta";

// Mode-specific components (to be created)
import { BrowserModeRecorder } from 'components/BrowserModeRecorder';
import { LiveModeRecorder } from 'components/LiveModeRecorder';
import { TraditionalModeRecorder } from 'components/TraditionalModeRecorder';

type TranscriptionMode = 'browser' | 'live' | 'traditional';

export default function Transcription() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode selection state
  const [transcriptionMode, setTranscriptionMode] = useState<TranscriptionMode>('browser');
  const [isRecording, setIsRecording] = useState(false);

  // Session and meeting metadata
  const [meetingTitle, setMeetingTitle] = useState<string>('');
  const [meetingPurpose, setMeetingPurpose] = useState<string>('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [newParticipant, setNewParticipant] = useState<string>('');

  // Freelancer fields
  const [clientName, setClientName] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [timeSpent, setTimeSpent] = useState<number>(0);

  // Company context
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Transcript state
  const [transcript, setTranscript] = useState<string>('');
  const [sessionSaved, setSessionSaved] = useState<boolean>(false);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);

  // Active tab for UI organization
  const [activeTab, setActiveTab] = useState('transcription');

  // Add participant
  const handleAddParticipant = useCallback(() => {
    if (!newParticipant.trim()) return;
    
    if (isRecording) {
      toast.warning('Cannot add participants while recording');
      return;
    }

    if (!participants.includes(newParticipant.trim())) {
      setParticipants([...participants, newParticipant.trim()]);
      setNewParticipant('');
    } else {
      toast.error('Participant already added');
    }
  }, [newParticipant, participants, isRecording]);

  // Remove participant
  const handleRemoveParticipant = useCallback((participant: string) => {
    if (isRecording) {
      toast.warning('Cannot remove participants while recording');
      return;
    }
    setParticipants(participants.filter(p => p !== participant));
  }, [participants, isRecording]);

  // Add tag
  const handleAddTag = useCallback(() => {
    if (!newTag.trim()) return;
    if (!tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  }, [newTag, tags]);

  // Remove tag
  const handleRemoveTag = useCallback((tag: string) => {
    setTags(tags.filter(t => t !== tag));
  }, [tags]);

  // Handle mode switching with safety check
  const handleModeChange = useCallback((newMode: TranscriptionMode) => {
    if (isRecording) {
      toast.error('Please stop recording before switching modes');
      return;
    }
    setTranscriptionMode(newMode);
    // Clear transcript when switching modes
    setTranscript('');
  }, [isRecording]);

  // Handle transcript updates from mode components
  const handleTranscriptUpdate = useCallback((newTranscript: string) => {
    setTranscript(newTranscript);
  }, []);

  // Handle recording state changes from mode components
  const handleRecordingStateChange = useCallback((recording: boolean) => {
    setIsRecording(recording);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <NoIndexMeta />
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Transcription</h1>
          <p className="text-muted-foreground">
            Choose your transcription mode and start capturing your meetings
          </p>
        </div>

        {/* Mode Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Transcription Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Browser Mode */}
              <button
                onClick={() => handleModeChange('browser')}
                disabled={isRecording}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  transcriptionMode === 'browser'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-border hover:border-blue-300'
                } ${isRecording ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">Browser</h3>
                  {transcriptionMode === 'browser' && (
                    <Badge variant="default">Active</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Simple, fast browser-based transcription
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">Free</Badge>
                  <Badge variant="outline" className="text-xs">Single Language</Badge>
                </div>
              </button>

              {/* Live Mode */}
              <button
                onClick={() => handleModeChange('live')}
                disabled={isRecording}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  transcriptionMode === 'live'
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : 'border-border hover:border-green-300'
                } ${isRecording ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">Live</h3>
                  {transcriptionMode === 'live' && (
                    <Badge variant="default" className="bg-green-600">Active</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Google STT with multi-speaker detection
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">Multi-Speaker</Badge>
                  <Badge variant="outline" className="text-xs">Shareable</Badge>
                </div>
              </button>

              {/* Traditional Mode */}
              <button
                onClick={() => handleModeChange('traditional')}
                disabled={isRecording}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  transcriptionMode === 'traditional'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                    : 'border-border hover:border-purple-300'
                } ${isRecording ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">Traditional</h3>
                  {transcriptionMode === 'traditional' && (
                    <Badge variant="default" className="bg-purple-600">Active</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Full-featured with Gemini Live processing
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">Always On</Badge>
                  <Badge variant="outline" className="text-xs">Full Features</Badge>
                </div>
              </button>
            </div>

            {/* Mode Description */}
            {transcriptionMode === 'browser' && (
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Browser mode uses your browser's built-in speech recognition. Best for quick, simple transcriptions.
                </AlertDescription>
              </Alert>
            )}
            {transcriptionMode === 'live' && (
              <Alert className="mt-4 border-green-200 dark:border-green-800">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Live mode uses Google Speech-to-Text with Google Gemini 2.5 fallback for highest accuracy and multi-speaker detection.
                </AlertDescription>
              </Alert>
            )}
            {transcriptionMode === 'traditional' && (
              <Alert className="mt-4 border-purple-200 dark:border-purple-800">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Traditional mode includes all features: dual transcription, speaker identification, and full session management.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transcription">Transcription</TabsTrigger>
            <TabsTrigger value="details">Meeting Details</TabsTrigger>
          </TabsList>

          {/* Transcription Tab */}
          <TabsContent value="transcription" className="space-y-4">
            {/* Render mode-specific component */}
            {transcriptionMode === 'browser' && (
              <BrowserModeRecorder
                meetingTitle={meetingTitle}
                meetingPurpose={meetingPurpose}
                participants={participants}
                onTranscriptUpdate={handleTranscriptUpdate}
                onRecordingStateChange={handleRecordingStateChange}
              />
            )}
            {transcriptionMode === 'live' && (
              <LiveModeRecorder
                meetingTitle={meetingTitle}
                meetingPurpose={meetingPurpose}
                participants={participants}
                companyId={companyId}
                onTranscriptUpdate={handleTranscriptUpdate}
                onRecordingStateChange={handleRecordingStateChange}
              />
            )}
            {transcriptionMode === 'traditional' && (
              <TraditionalModeRecorder
                meetingTitle={meetingTitle}
                meetingPurpose={meetingPurpose}
                participants={participants}
                companyId={companyId}
                clientName={clientName}
                projectName={projectName}
                tags={tags}
                onTranscriptUpdate={handleTranscriptUpdate}
                onRecordingStateChange={handleRecordingStateChange}
              />
            )}
          </TabsContent>

          {/* Meeting Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Meeting Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Meeting Title */}
                <div>
                  <Label htmlFor="meetingTitle">Meeting Title</Label>
                  <Input
                    id="meetingTitle"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder="Enter meeting title"
                  />
                </div>

                {/* Meeting Purpose */}
                <div>
                  <Label htmlFor="meetingPurpose">Meeting Purpose</Label>
                  <Textarea
                    id="meetingPurpose"
                    value={meetingPurpose}
                    onChange={(e) => setMeetingPurpose(e.target.value)}
                    placeholder="Describe the purpose of this meeting"
                    rows={3}
                  />
                </div>

                {/* Participants */}
                <div>
                  <Label>Participants</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newParticipant}
                      onChange={(e) => setNewParticipant(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddParticipant()}
                      placeholder="Add participant name"
                    />
                    <Button onClick={handleAddParticipant} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {participants.map((participant) => (
                      <Badge key={participant} variant="secondary" className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {participant}
                        <button
                          onClick={() => handleRemoveParticipant(participant)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Freelancer Fields */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 text-sm text-muted-foreground">Freelancer Details (Optional)</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="clientName">Client Name</Label>
                      <Input
                        id="clientName"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Client name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="projectName">Project Name</Label>
                      <Input
                        id="projectName"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Project name"
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <Label>Tags</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                          placeholder="Add tag"
                        />
                        <Button onClick={handleAddTag} size="icon" variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="flex items-center gap-1">
                            <TagsIcon className="h-3 w-3" />
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Additional notes"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
