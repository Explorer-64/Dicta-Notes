import React, { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Monitor, Mic, Globe, Play, ShieldAlert, Wrench } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { SchemaMarkup } from "components/SchemaMarkup";

export default function VideoMeetingsGuide() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Video Meetings Guide - Dicta-Notes</title>
        <meta name="description" content="Use Dicta-Notes with Zoom, Microsoft Teams, Google Meet and more. Capture meeting audio from your browser and get AI-powered transcripts with speaker identification and translation in 130+ languages." />
        <link rel="canonical" href="https://dicta-notes.com/video-meetings-guide" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Video Meetings Guide - Dicta-Notes" />
        <meta property="og:description" content="Step-by-step instructions for capturing online meeting audio (Zoom, Teams, Meet) using your browser with Google Gemini 2.5 transcription, 10+ speaker identification, and translation in 130+ languages." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://dicta-notes.com/video-meetings-guide" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Video Meetings Guide - Dicta-Notes" />
        <meta name="twitter:description" content="Capture and transcribe Zoom, Teams, and Google Meet with AI-powered speaker identification and translation." />
      </Helmet>
      
      {/* Article Schema for SEO */}
      <SchemaMarkup 
        type="Article"
        data={{
          headline: "Video Meetings Guide: Zoom, Teams, Google Meet",
          description: "Use Dicta-Notes with Zoom, Microsoft Teams, Google Meet and more. Capture meeting audio from your browser and get AI-powered transcripts with speaker identification and translation in 130+ languages.",
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
            className="mb-6 text-sm text-primary hover:text-primary/90"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Instructions
          </Button>

          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-foreground">Video Meetings Guide</h1>

          {/* Overview */}
          <Card className="mb-6 bg-card">
            <CardHeader>
              <CardTitle className="text-xl">What Works with Dicta-Notes</CardTitle>
              <CardDescription>Transcribe your online meetings directly in the browser</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-foreground">
              <ul className="list-disc pl-6 space-y-2">
                <li>Compatible with Zoom, Microsoft Teams, Google Meet, Webex, and most web-based platforms</li>
                <li>No installs required — capture audio using your browser</li>
                <li>Google Gemini 2.5 transcription with 10+ speakers identified</li>
                <li>Translation in 130+ languages</li>
                <li>Export to PDF, Word, Text, or Markdown</li>
              </ul>
            </CardContent>
          </Card>

          {/* Setup: Capture Meeting Audio */}
          <Card className="mb-6 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Monitor className="h-5 w-5" /> Capture Meeting Audio (System Audio)</CardTitle>
              <CardDescription>Best method for Zoom/Teams/Meet running in your browser</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground">
              <ol className="list-decimal pl-6 space-y-2">
                <li>Open the <strong>Transcribe</strong> page</li>
                <li>Set <strong>Audio Source</strong> to <em>System Audio</em></li>
                <li>Click <strong>Start</strong> and when prompted, select the tab or window with your meeting</li>
                <li>Make sure the "Share tab audio" or "Share system audio" box is checked</li>
              </ol>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted p-4 rounded border">
                  <h4 className="font-semibold mb-1">Chrome / Edge</h4>
                  <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                    <li>Choose the specific tab with your meeting</li>
                    <li>Ensure "Share tab audio" is enabled</li>
                    <li>For desktop apps, choose "Share entire screen" and enable system audio</li>
                  </ul>
                </div>
                <div className="bg-muted p-4 rounded border">
                  <h4 className="font-semibold mb-1">Safari / Firefox</h4>
                  <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                    <li>System audio support varies by version</li>
                    <li>If "share audio" isn't available, use Microphone mode</li>
                    <li>Test with a short meeting to confirm audio capture</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Tip: You can always switch back to Microphone mode if your browser/device doesn't offer system audio sharing.</p>
            </CardContent>
          </Card>

          {/* Start and Record */}
          <Card className="mb-6 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Play className="h-5 w-5" /> Start Your Online Meeting</CardTitle>
              <CardDescription>Dual-layer experience: instant on-screen words + AI-quality transcription when saved</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-foreground">
              <ol className="list-decimal pl-6 space-y-2">
                <li>Click <strong>Start Recording</strong> when your meeting begins</li>
                <li>Watch live words appear on screen for immediate feedback</li>
                <li>When finished, click <strong>Stop</strong> and then <strong>Save Session</strong></li>
                <li>Open the saved session to run AI transcription with <strong>Google Gemini 2.5</strong></li>
              </ol>
              <p className="text-sm text-muted-foreground">The saved session provides speaker labeling (10+ speakers), language detection, translation in 130+ languages, and multiple export options.</p>
            </CardContent>
          </Card>

          {/* Platform-specific tips */}
          <Card className="mb-6 bg-card">
            <CardHeader>
              <CardTitle>Platform Tips</CardTitle>
              <CardDescription>Optimize capture for popular meeting tools</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4 text-foreground">
              <div className="bg-muted p-4 rounded border">
                <h4 className="font-semibold mb-1">Zoom</h4>
                <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                  <li>Join Zoom in your browser if possible</li>
                  <li>Select the Zoom tab and enable "Share tab audio"</li>
                  <li>If using desktop app, share entire screen with system audio</li>
                </ul>
              </div>
              <div className="bg-muted p-4 rounded border">
                <h4 className="font-semibold mb-1">Microsoft Teams</h4>
                <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                  <li>Use Chrome or Edge for best results</li>
                  <li>Select the Teams tab/window and share system audio</li>
                  <li>Confirm the system volume isn't muted</li>
                </ul>
              </div>
              <div className="bg-muted p-4 rounded border">
                <h4 className="font-semibold mb-1">Google Meet</h4>
                <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
                  <li>Choose the Meet tab and enable "Share tab audio"</li>
                  <li>Keep the tab unmuted in your browser</li>
                  <li>Use a headset to prevent feedback</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Best practices */}
          <Card className="mb-6 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mic className="h-5 w-5" /> Best Practices</CardTitle>
              <CardDescription>Simple tips for clearer audio and better transcripts</CardDescription>
            </CardHeader>
            <CardContent className="text-foreground">
              <ul className="list-disc pl-6 space-y-2">
                <li>Don't mute the meeting tab when using System Audio</li>
                <li>Set system volume to a comfortable, consistent level</li>
                <li>Close noisy tabs and apps to reduce background sounds</li>
                <li>For in-room meetings, Microphone mode near speakers works well</li>
              </ul>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card className="mb-6 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" /> Troubleshooting</CardTitle>
              <CardDescription>Common fixes if audio isn't captured</CardDescription>
            </CardHeader>
            <CardContent className="text-foreground">
              <ul className="list-disc pl-6 space-y-2">
                <li>No "Share audio" option? Switch to Microphone mode</li>
                <li>Mac users: enable browser Screen Recording permission in System Settings</li>
                <li>Seeing "track ended"? Stop and start sharing the tab/window again</li>
                <li>Echo/feedback? Avoid capturing microphone and system audio simultaneously</li>
              </ul>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Privacy & Security</CardTitle>
              <CardDescription>Professional defaults, clear control</CardDescription>
            </CardHeader>
            <CardContent className="text-foreground">
              <ul className="list-disc pl-6 space-y-2">
                <li>Your browser asks for permission before any capture starts</li>
                <li>Sessions are saved only when you click Save; you control exports</li>
                <li>Data is stored securely with Firebase when saved</li>
              </ul>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
