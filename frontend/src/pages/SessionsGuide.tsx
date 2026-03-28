import React, { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Filter, Headphones, FileText, Users, Tags, Clock, Search, Download, Info, RefreshCw, Shield } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { SchemaMarkup } from "components/SchemaMarkup";

export default function SessionsGuide() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Session Management Guide - Dicta-Notes</title>
        <meta name="description" content="Learn how to view, filter, and manage your meeting sessions, process on-demand transcription with Google Gemini 2.5, translate in 130+ languages, and export to PDF, Word, Text, or Markdown." />
        <link rel="canonical" href="https://dicta-notes.com/sessions-guide" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Session Management Guide - Dicta-Notes" />
        <meta property="og:description" content="Everything you need to know about managing sessions: filters, tabs, details, speakers, translation in 130+ languages, exports, and more." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://dicta-notes.com/sessions-guide" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Session Management Guide - Dicta-Notes" />
        <meta name="twitter:description" content="Manage your meeting sessions: Google Gemini 2.5 transcription, 10+ speakers, translation, and export options." />
      </Helmet>
      
      {/* Article Schema for SEO */}
      <SchemaMarkup 
        type="Article"
        data={{
          headline: "Session Management Guide",
          description: "Learn how to view, filter, and manage your meeting sessions, process on-demand transcription with Google Gemini 2.5, translate, and export.",
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
        <div className="container mx-auto px-4 py-8 sm:py-10 mt-4 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate("/instructions")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Instructions
          </Button>

          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Session Management</h1>
          <p className="text-muted-foreground mb-6">Everything you need to organize your recordings, run AI transcription on demand, translate into 130+ languages, and export your results.</p>

          <div className="space-y-6">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
                <CardDescription>Where to find your meetings and what you can do with them</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="list-disc pl-5 space-y-2">
                  <li>All saved recordings appear on the Sessions page. Open it from the top navigation or go to <strong>/sessions</strong>.</li>
                  <li>Each card shows the title, created date, duration, speakers count, and optional client, project, purpose, and tags.</li>
                  <li>Click <strong>View Details</strong> on any session to process transcription with Google Gemini 2.5, edit speaker names, translate, and export.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-5 w-5 text-orange-600" />
                  Tabs on Sessions
                </CardTitle>
                <CardDescription>Quick ways to focus on the sessions you need</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>All Sessions</strong> — Every saved session.</li>
                  <li><strong>With Documents</strong> — Sessions that have added documents or images.</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5"><Headphones className="h-4 w-4 text-emerald-600"/></span><span><strong>With Audio</strong> — Sessions that include audio for playback inside the detail page.</span></li>
                </ul>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5 text-blue-600"/> Powerful Filters</CardTitle>
                <CardDescription>Find the right session fast</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="list-disc pl-5 space-y-2">
                  <li className="flex gap-2 items-start"><Search className="h-4 w-4 mt-0.5 text-blue-600"/>Search by title</li>
                  <li className="flex gap-2 items-start"><Users className="h-4 w-4 mt-0.5 text-blue-600"/>Filter by <strong>Client</strong> (Freelancer mode)</li>
                  <li className="flex gap-2 items-start"><FileText className="h-4 w-4 mt-0.5 text-blue-600"/>Filter by <strong>Project</strong></li>
                  <li className="flex gap-2 items-start"><Tags className="h-4 w-4 mt-0.5 text-blue-600"/>Filter by <strong>Tags</strong> — add multiple and we’ll match sessions that contain any of them</li>
                  <li className="flex gap-2 items-start"><Clock className="h-4 w-4 mt-0.5 text-blue-600"/>See <strong>Duration</strong> and <strong>Created</strong> dates at a glance</li>
                </ul>
              </CardContent>
            </Card>

            {/* Viewing details */}
            <Card>
              <CardHeader>
                <CardTitle>Viewing a Session</CardTitle>
                <CardDescription>Open <em>View Details</em> to work with the session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Transcription (On-Demand):</strong> Click Process/Transcribe in the session detail to let <strong>Google Gemini 2.5</strong> create the transcript with <strong>10+ speaker identification</strong>.</li>
                  <li><strong>Audio Playback:</strong> Use the built-in player to review the original recording.</li>
                  <li><strong>Edit Speakers:</strong> Rename speaker labels after transcription for clarity. Changes are saved to the session.</li>
                  <li><strong>Notes & Documents:</strong> Add notes and attach supporting images or files. Sessions with documents appear under the “With Documents” tab.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Translation */}
            <Card>
              <CardHeader>
                <CardTitle>Translation (130+ languages)</CardTitle>
                <CardDescription>Translate transcripts using Google’s best-in-class translation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="list-disc pl-5 space-y-2">
                  <li>Choose your target language on the session detail page.</li>
                  <li>Content is translated while preserving speakers and structure.</li>
                  <li>Use it for multilingual teams or cross-language reporting.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5 text-emerald-600"/> Export Options</CardTitle>
                <CardDescription>Share or archive your results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>PDF</strong> — Clean layout for distribution</li>
                  <li><strong>Word</strong> (.docx) — Edit-friendly format</li>
                  <li><strong>Text</strong> — Plain text</li>
                  <li><strong>Markdown</strong> — Great for knowledge bases</li>
                </ul>
              </CardContent>
            </Card>

            {/* Maintenance */}
            <Card>
              <CardHeader>
                <CardTitle>Maintenance & Management</CardTitle>
                <CardDescription>Keep your workspace tidy and fast</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Refresh</strong> — Use the Refresh button on the Sessions page to load the latest items. <RefreshCw className="inline h-4 w-4 text-muted-foreground"/></li>
                  <li><strong>Delete</strong> — Remove old sessions you no longer need from the session detail page.</li>
                  <li><strong>Offline</strong> — When offline, you’ll see an indicator and cached sessions. Some actions will resume on reconnect.</li>
                  <li><strong>Migration Manager</strong> — If prompted, follow the on-screen steps to move older data into the newest structure.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-gray-600"/> Privacy & Access</CardTitle>
                <CardDescription>Protected pages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>The Sessions and Session Detail pages are protected and require login. Your data is stored securely with Firebase services.</p>
              </CardContent>
            </Card>

            {/* Quick links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
                <CardDescription>Jump straight to what you need</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => navigate("/sessions")}>Go to Sessions</Button>
                <Button variant="outline" onClick={() => navigate("/transcribe")}>Start a New Recording</Button>
              </CardContent>
            </Card>

            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Info className="h-4 w-4" />
              Content reflects the current production feature set: session filters, tabs, on-demand Gemini transcription, speaker editing, translation, and exports.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
