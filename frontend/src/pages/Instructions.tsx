import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, FileText, Users, Camera, Download, History, Clock, Play, Monitor, Globe, Settings } from "lucide-react";
import { Header } from "components/Header";
import { BackButton } from "components/BackButton";
import { Helmet } from "react-helmet-async";
import { UploadAudioVideoInstructions } from "components/UploadAudioVideoInstructions";

export default function Instructions() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("simple-setup");
  const location = useLocation();
  
  // Check if we should open specific tabs directly
  React.useEffect(() => {
    if (location.state?.tab === 'faqs') {
      setActiveTab('faqs');
    } else if (location.state?.tab === 'getting-started') {
      setActiveTab('getting-started');
    } else if (location.state?.tab === 'upload') {
      setActiveTab('upload');
    }
  }, [location.state]);

  const handleTabChange = (value) => {
    // Redirect certain tabs to dedicated guide pages
    if (value === 'companies') {
      navigate('/companies-guide');
      return;
    }
    if (value === 'sessions') {
      navigate('/sessions-guide');
      return;
    }
    // NEW: Redirect Video Meetings tab to dedicated guide page
    if (value === 'video-meetings') {
      navigate('/video-meetings-guide');
      return;
    }
    // NEW: Redirect FAQs tab to dedicated FAQs page
    if (value === 'faqs') {
      navigate('/fa-qs');
      return;
    }
    // NEW: Redirect Documents tab to dedicated Documents guide page
    if (value === 'documents') {
      navigate('/documents-guide');
      return;
    }
    // NEW: Redirect Recording tab to dedicated Recording guide page
    if (value === 'recording') {
      navigate('/recording-guide');
      return;
    }
    // NEW: Redirect Getting Started tab to dedicated Getting Started guide page
    if (value === 'getting-started') {
      navigate('/getting-started-guide');
      return;
    }
    // Upload tab stays on this page
    setActiveTab(value);
  };

  return (
    <>
      <Helmet>
        <title>Instructions & Guides - Dicta-Notes</title>
        <meta name="description" content="Step-by-step guides for using Dicta-Notes: AI-powered meeting transcription with Gemini 2.5 Pro, 10+ speaker identification, translation in 130+ languages, and export options." />
        <link rel="canonical" href="https://dicta-notes.com/instructions" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Instructions & Guides - Dicta-Notes" />
        <meta property="og:description" content="Find step-by-step guides for meeting transcription, speaker identification, translation, and document analysis." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/instructions" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Instructions & Guides - Dicta-Notes" />
        <meta name="twitter:description" content="Comprehensive guides for AI-powered meeting transcription and collaboration." />
      </Helmet>
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <BackButton />
          <h1 className="text-3xl font-bold mb-2">Getting Started with Dicta-Notes</h1>
          <p className="text-muted-foreground mb-6">
            Find detailed guides and answers to common questions about using Dicta-Notes for AI-powered meeting transcription, speaker identification, and document analysis.
          </p>

          {/* Mobile dropdown selector - only visible on small screens */}
          <div className="block sm:hidden mb-4">
            <Select value={activeTab} onValueChange={handleTabChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple-setup">Simple Setup</SelectItem>
                <SelectItem value="video-meetings">Video Meeting Setup</SelectItem>
                <SelectItem value="getting-started">Getting Started</SelectItem>
                <SelectItem value="recording">Recording & Transcription</SelectItem>
                <SelectItem value="documents">Document Processing</SelectItem>
                <SelectItem value="sessions">Session Management</SelectItem>
                <SelectItem value="upload">Upload Audio/Video</SelectItem>
                <SelectItem value="companies">Company Features</SelectItem>
                <SelectItem value="faqs">FAQs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            {/* Tab list - hidden on mobile, visible on larger screens */}
            <TabsList className="hidden sm:grid w-full grid-cols-4 lg:grid-cols-9">
              <TabsTrigger value="simple-setup" className="text-xs">Simple Setup</TabsTrigger>
              <TabsTrigger value="video-meetings" className="text-xs">Video Meetings</TabsTrigger>
              <TabsTrigger value="getting-started" className="text-xs">Getting Started</TabsTrigger>
              <TabsTrigger value="recording" className="text-xs">Recording</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs">Documents</TabsTrigger>
              <TabsTrigger value="sessions" className="text-xs">Sessions</TabsTrigger>
              <TabsTrigger value="upload" className="text-xs">Upload Audio/Video</TabsTrigger>
              <TabsTrigger value="companies" className="text-xs">Companies</TabsTrigger>
              <TabsTrigger value="faqs" className="text-xs">FAQs</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[60vh] sm:h-[70vh] rounded-md border p-3 sm:p-4">
              <TabsContent value="simple-setup" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mic className="h-5 w-5 text-blue-500" />
                      Universal Transcription Platform - Choose Your Engine
                    </CardTitle>
                    <CardDescription>
                      Dicta-Notes offers three powerful transcription engines for different meeting needs. Choose the best option for your situation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <h3 className="text-lg font-semibold text-blue-800 mb-2">🚀 What Dicta-Notes Does</h3>
                      <p className="text-blue-700 mb-3">
                        Dicta-Notes is an advanced universal transcription platform that works natively in 130+ languages. 
                        It uses three powerful AI engines working together to give you the best transcription experience!
                      </p>
                      <div className="grid md:grid-cols-3 gap-4 mt-4">
                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-semibold text-green-700">🟢 Browser Speech</h4>
                          <p className="text-sm text-gray-600">Real-time UX feedback as you speak</p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-semibold text-purple-700">🟣 Gemini 2.5 Pro</h4>
                          <p className="text-sm text-gray-600">Powerful AI transcription engine</p>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <h4 className="font-semibold text-blue-700">🔵 Google Translate</h4>
                          <p className="text-sm text-gray-600">Translation between 130+ languages</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">📱 What You Need</h3>
                      <ul className="list-disc pl-5 space-y-1 text-green-700">
                        <li>Any computer, tablet, or phone with internet</li>
                        <li>A microphone (every device has one built-in)</li>
                        <li>Web browser (Chrome, Firefox, Safari, Edge)</li>
                        <li>That's it! No special software to install</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-green-600">🚀 Step 1: Access the Platform</h3>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <ol className="list-decimal pl-5 space-y-2 text-green-800">
                          <li>Open your web browser</li>
                          <li>Go to: <strong>dicta-notes.com</strong></li>
                          <li>Log in with your account (ask your administrator if you don't have one)</li>
                          <li>Click <strong>"Transcribe"</strong> in the top navigation</li>
                        </ol>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-blue-600">🎯 Step 2: Start Recording</h3>
                      <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                        <p className="text-blue-800 font-medium">The system has four key components working together:</p>
                        
                        <div className="grid gap-4">
                          <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                            <h4 className="font-bold text-green-700 mb-2">🟢 Engine 1: Browser Speech (UX Feedback)</h4>
                            <p className="text-sm text-gray-700 mb-2"><strong>What it does:</strong> Shows real-time text as you speak</p>
                            <ul className="text-sm text-gray-600 list-disc pl-4 space-y-1">
                              <li>Instant visual feedback during recording</li>
                              <li>Client-side speech recognition</li>
                              <li>Display only - helps you see the meeting is being captured</li>
                              <li>No internet delay, responds immediately</li>
                            </ul>
                            <p className="text-xs text-green-600 mt-2"><strong>Note:</strong> This is for UX only - not the final transcript</p>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border-l-4 border-orange-500">
                            <h4 className="font-bold text-orange-700 mb-2">🟠 Recording System (Audio Capture)</h4>
                            <p className="text-sm text-gray-700 mb-2"><strong>What it does:</strong> Records the actual audio for processing</p>
                            <ul className="text-sm text-gray-600 list-disc pl-4 space-y-1">
                              <li>Captures entire meeting audio in high quality</li>
                              <li>Saves raw audio to secure cloud storage</li>
                              <li>Creates session document with meeting metadata</li>
                              <li>Ready for AI transcription when you need it</li>
                            </ul>
                            <p className="text-xs text-orange-600 mt-2"><strong>Setup:</strong> Runs automatically in the background</p>
                          </div>

                          <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                            <h4 className="font-bold text-purple-700 mb-2">🟣 Engine 2: Gemini 2.5 Pro (AI Transcription)</h4>
                            <p className="text-sm text-gray-700 mb-2"><strong>What it does:</strong> Creates professional transcription when you need it</p>
                            <ul className="text-sm text-gray-600 list-disc pl-4 space-y-1">
                              <li>Powerful AI transcription with speaker identification</li>
                              <li>Works in 130+ languages natively</li>
                              <li>Process saved audio whenever you're ready</li>
                              <li>High-quality, production-ready transcripts</li>
                            </ul>
                            <p className="text-xs text-purple-600 mt-2"><strong>Use:</strong> Click "Process" on any saved session to transcribe</p>
                          </div>

                          <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                            <h4 className="font-bold text-blue-700 mb-2">🔵 Engine 3: Google Translate (Translation)</h4>
                            <p className="text-sm text-gray-700 mb-2"><strong>What it does:</strong> Translates transcripts between languages</p>
                            <ul className="text-sm text-gray-600 list-disc pl-4 space-y-1">
                              <li>Gold standard for text translation</li>
                              <li>130+ languages supported</li>
                              <li>Translate transcripts for international teams</li>
                              <li>Real-time translation available</li>
                            </ul>
                            <p className="text-xs text-blue-600 mt-2"><strong>Note:</strong> Only needed if converting between languages - Gemini transcribes natively</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-purple-600">📝 Step 3: Start Your Meeting</h3>
                      <div className="bg-purple-50 p-4 rounded-lg ">
                        <ol className="list-decimal pl-5 space-y-2 text-purple-800">
                          <li>Choose your transcription engine (see Step 2 above)</li>
                          <li>Click the corresponding "Start" button</li>
                          <li>Grant microphone permissions when prompted</li>
                          <li>Begin your meeting and speak normally</li>
                          <li>Watch words appear in real-time on your screen</li>
                          <li>The AI automatically identifies different speakers</li>
                        </ol>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-orange-600">🌍 Step 4: Language Support</h3>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-orange-700">Native Language Transcription</h4>
                            <p className="text-sm text-orange-800">Dicta-Notes transcribes natively in 130+ languages - no translation needed! Just speak in your language and get accurate transcription.</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-orange-700">Optional Translation Features</h4>
                            <p className="text-sm text-orange-800">For multilingual teams, use the translation toggle to convert transcriptions between languages in real-time.</p>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <p className="text-xs text-gray-600"><strong>Example:</strong> Spanish meeting → transcribed in Spanish → optionally translated to English for non-Spanish speakers</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-red-600">✅ Step 5: Save and Share</h3>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <ol className="list-decimal pl-5 space-y-2 text-red-800">
                          <li>When your meeting ends, click <strong>"Stop Recording"</strong></li>
                          <li>Click <strong>"Save Session"</strong> to preserve your transcription</li>
                          <li>Enter a descriptive name (e.g., "Q1 Planning Meeting - Jan 2025")</li>
                          <li>Choose export format: PDF, Word, Text, or Markdown</li>
                          <li>Share with participants or archive for future reference</li>
                        </ol>
                      </div>
                    </div>

                    <div className="bg-cyan-50 p-4 rounded-lg border-l-4 border-cyan-500">
                      <h3 className="text-lg font-semibold text-cyan-800 mb-2">🔗 Enterprise Features Available</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <ul className="list-disc pl-5 space-y-1 text-cyan-700">
                          <li><strong>Company Workspaces</strong> - Team collaboration</li>
                          <li><strong>On-Demand Transcription</strong> - Process recordings when ready</li>
                          <li><strong>Advanced Security</strong> - Firebase enterprise auth</li>
                          <li><strong>PWA Installation</strong> - Works like native app</li>
                        </ul>
                        <ul className="list-disc pl-5 space-y-1 text-cyan-700">
                          <li><strong>Document Analysis</strong> - Upload/capture document images for AI analysis</li>
                          <li><strong>Speaker Management</strong> - 10+ speaker identification</li>
                          <li><strong>Audio Playback</strong> - Waveform visualization</li>
                          <li><strong>Cross-Platform</strong> - Desktop, mobile, tablet</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">💡 Pro Tips for Best Results</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <ul className="list-disc pl-5 space-y-1 text-yellow-700">
                          <li><strong>Speak clearly</strong> - Normal pace, clear pronunciation</li>
                          <li><strong>Minimize overlapping</strong> - Let speakers finish before others start</li>
                          <li><strong>Good audio setup</strong> - Close to microphone, quiet environment</li>
                          <li><strong>Test first</strong> - Try a quick test recording before important meetings</li>
                        </ul>
                        <ul className="list-disc pl-5 space-y-1 text-yellow-700">
                          <li><strong>Save recordings</strong> - Process with Gemini 2.5 Pro when ready</li>
                          <li><strong>Use System Audio</strong> for screen-shared presentations</li>
                          <li><strong>Use Microphone</strong> for in-person meetings</li>
                          <li><strong>Install PWA</strong> for better performance</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500">
                      <h3 className="text-lg font-semibold text-amber-800 mb-2">📱 Mobile Recording Tips</h3>
                      <p className="text-amber-800 text-sm mb-3">
                        On phones and tablets, the operating system pauses audio capture when you switch to another app.
                        For an uninterrupted recording, keep Dicta-Notes open and in the foreground for the full duration of your meeting.
                      </p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-amber-700 mb-1">✅ Best practice on mobile</h4>
                          <ul className="list-disc pl-5 space-y-1 text-amber-700 text-sm">
                            <li>Dedicate your phone to the recording — don't use it for anything else during the meeting</li>
                            <li>Disable screen auto-lock or keep the screen on</li>
                            <li>Turn on Do Not Disturb to avoid notification interruptions</li>
                            <li>Install the app from Safari (iPhone) or Chrome (Android) for the best experience</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-amber-700 mb-1">💻 On desktop you can multitask freely</h4>
                          <ul className="list-disc pl-5 space-y-1 text-amber-700 text-sm">
                            <li>Switch tabs, look things up, or write notes — recording continues uninterrupted</li>
                            <li>Chrome, Edge, and Firefox all keep the recording running in the background</li>
                            <li>Use a laptop or desktop for meetings where you'll need your device for other tasks</li>
                          </ul>
                        </div>
                      </div>
                      <p className="text-amber-600 text-xs mt-3">
                        <strong>Note:</strong> If you do switch apps on Android, the app will show you exactly how long it was in the background so you know what may have been missed.
                      </p>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                      <h3 className="text-lg font-semibold text-red-800 mb-2">⚠️ Troubleshooting</h3>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-medium text-red-700">Browser Speech (UX) Issues:</h4>
                          <ul className="list-disc pl-5 space-y-1 text-red-600 text-sm">
                            <li>Refresh page if words stop appearing</li>
                            <li>Check browser microphone permissions</li>
                            <li>Switch to Chrome/Edge for best compatibility</li>
                            <li>Remember: This is just visual feedback, your audio is still being recorded</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-medium text-red-700">Recording Issues:</h4>
                          <ul className="list-disc pl-5 space-y-1 text-red-600 text-sm">
                            <li>Check microphone/system audio permissions</li>
                            <li>Ensure stable internet connection for saving</li>
                            <li>Verify sufficient storage space in your account</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-medium text-red-700">Transcription Processing Issues:</h4>
                          <ul className="list-disc pl-5 space-y-1 text-red-600 text-sm">
                            <li>Wait for Gemini 2.5 Pro processing to complete</li>
                            <li>Check session detail page for progress</li>
                            <li>Large audio files may take a few minutes to process</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">❔ Remember</h3>
                      <div className="text-gray-700 space-y-2">
                        <p>
                          <strong>This is a professional enterprise platform!</strong> Three powerful AI engines work together: 
                          Browser Speech for instant UX feedback, Gemini 2.5 Pro for professional transcription, and Google Translate for international collaboration.
                        </p>
                        <p>
                          <strong>Universal language support:</strong> Gemini 2.5 Pro transcribes natively in 130+ languages - you only need Google Translate 
                          if you want to convert transcripts between different languages for team collaboration.
                        </p>
                        <p>
                          <strong>Need help?</strong> Use the floating support chat in the bottom-right corner, or ask your team administrator 
                          for guidance on using the recording and transcription features.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Document Analysis</CardTitle>
                    <CardDescription>
                      Upload and analyze meeting documents with AI
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>Document analysis features coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="video-meetings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Video Meeting Integration</CardTitle>
                    <CardDescription>
                      How to use Dicta-Notes with video conferencing platforms
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>Video meeting integration guide coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sessions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Session Management</CardTitle>
                    <CardDescription>
                      How to manage your meeting sessions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>Session management guide coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="companies" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Company Workspaces</CardTitle>
                    <CardDescription>
                      How to use company features and team collaboration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>Company workspace guide coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="faqs" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Frequently Asked Questions</CardTitle>
                    <CardDescription>
                      Common questions about using Dicta-Notes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>FAQs coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="upload" className="space-y-6">
                <UploadAudioVideoInstructions />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>
    </>
  );
}
