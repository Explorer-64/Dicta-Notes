import React, { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mic, Pause, Play, Globe, Monitor, Wrench, ShieldCheck, Info } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { SchemaMarkup } from "components/SchemaMarkup";

export default function RecordingGuide() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Recording & Transcription Guide - Dicta-Notes</title>
        <meta name="description" content="How to record meetings in Dicta-Notes and get AI-powered transcripts with 10+ speakers, translation to 130+ languages, and easy exports." />
        <meta property="og:title" content="Recording & Transcription Guide - Dicta-Notes" />
        <meta property="og:description" content="Start, pause, and stop recordings; capture system audio for online meetings; process transcripts with Gemini 2.5 Pro; translate and export." />
      </Helmet>
      
      {/* Article Schema for SEO */}
      <SchemaMarkup 
        type="Article"
        data={{
          headline: "Recording & Transcription Guide",
          description: "How to record meetings in Dicta-Notes and get AI-powered transcripts with 10+ speakers, translation to 130+ languages, and easy exports.",
          author: {
            '@type': 'Organization',
            name: 'Dicta-Notes'
          },
          publisher: {
            '@type': 'Organization',
            name: 'Dicta-Notes'
          },
          datePublished: "2025-01-01",
          dateModified: "2025-01-14"
        }}
      />
      
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 sm:py-10 mt-4 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/instructions")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Instructions
          </Button>

          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Recording & Transcription</h1>
          <p className="text-muted-foreground mb-6">How to record meetings, see live words on-screen, then save and process an AI-quality transcript with speakers, translation, and exports.</p>

          <div className="space-y-6">
            {/* Getting started */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mic className="h-5 w-5 text-blue-600" />Start a Recording</CardTitle>
                <CardDescription>Where to begin and basic controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Open the <strong>Transcribe</strong> page</li>
                  <li>If you see previous content, click <strong>New Session</strong> or <strong>Clear</strong></li>
                  <li>Click <strong>Start Recording</strong> and grant microphone permission when prompted</li>
                  <li>Speak normally — live words appear instantly on-screen</li>
                  <li>Use <strong>Pause</strong> / <strong>Resume</strong> for breaks</li>
                  <li>Click <strong>Stop</strong> when finished, then <strong>Save Session</strong></li>
                </ol>
              </CardContent>
            </Card>

            {/* Dual layer explanation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Play className="h-5 w-5 text-emerald-600" />Dual‑Layer Experience</CardTitle>
                <CardDescription>Immediate feedback + AI-quality results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Live layer:</strong> Words appear on-screen while you speak for instant confidence.</li>
                  <li><strong>AI layer (after save):</strong> Open the saved session to process with <strong>Gemini 2.5 Pro</strong> for high-accuracy transcription and <strong>10+ speaker identification</strong>.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Audio sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Monitor className="h-5 w-5 text-purple-600" />Choose Your Audio Source</CardTitle>
                <CardDescription>Microphone or System/Tab Audio for online meetings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded border">
                    <h4 className="font-semibold mb-1">Microphone</h4>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1 text-sm">
                      <li>Best for in‑person meetings</li>
                      <li>Place the device/mic near speakers</li>
                      <li>Reduce background noise for clarity</li>
                    </ul>
                  </div>
                  <div className="bg-muted p-4 rounded border">
                    <h4 className="font-semibold mb-1">System/Tab Audio</h4>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1 text-sm">
                      <li>Best for Zoom/Teams/Meet in your browser</li>
                      <li>Select the meeting tab/window and enable “Share audio”</li>
                      <li>See the <span className="text-primary cursor-pointer hover:underline" onClick={() => navigate('/video-meetings-guide')}>Video Meetings Guide</span> for step‑by‑step tips</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Translation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-orange-600" />Translation (130+ languages)</CardTitle>
                <CardDescription>Real‑time viewing and translated outputs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Optionally select a target language during recording to see translated text while you work.</li>
                  <li>After saving, you can generate translated transcripts from the session page.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Controls & statuses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Pause className="h-5 w-5 text-yellow-600" />Controls & Status</CardTitle>
                <CardDescription>Clear indicators while recording</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Recording</strong> — Red indicator with a running timer</li>
                  <li><strong>Paused</strong> — Yellow indicator; resume to continue</li>
                  <li><strong>Processing</strong> — Brief AI processing after you save; then open the session for full results</li>
                </ul>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Tips for Better Transcription</CardTitle>
                <CardDescription>Small tweaks, big improvements</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>Use a good microphone, close to the speakers</li>
                  <li>Minimize overlapping conversations when possible</li>
                  <li>Close noisy apps/tabs; keep a steady system volume</li>
                  <li>Do a quick test recording before important meetings</li>
                </ul>
              </CardContent>
            </Card>

            {/* Troubleshooting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5 text-red-600" />Troubleshooting</CardTitle>
                <CardDescription>Common quick fixes</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>No words appearing? Refresh the page and check microphone permissions</li>
                  <li>No system audio option? Switch to Microphone mode or see the Video Meetings Guide</li>
                  <li>Echo/feedback? Avoid capturing mic and system audio at the same time</li>
                </ul>
              </CardContent>
            </Card>

            {/* Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-gray-700" />Privacy & Saving</CardTitle>
                <CardDescription>Your control, secure storage</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Recording starts only after you grant permission</li>
                  <li>Nothing is saved until you click <strong>Save Session</strong></li>
                  <li>Saved data is stored securely with Firebase</li>
                </ul>
              </CardContent>
            </Card>

            {/* Quick links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" />Quick Links</CardTitle>
                <CardDescription>Jump right in</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => navigate('/transcribe')}>Go to Transcribe</Button>
                <Button variant="outline" onClick={() => navigate('/sessions')}>Open Sessions</Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}
