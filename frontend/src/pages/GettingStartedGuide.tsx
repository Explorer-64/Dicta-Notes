import React, { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { SchemaMarkup } from "components/SchemaMarkup";

export default function GettingStartedGuide() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Getting Started Guide - Dicta-Notes</title>
        <meta name="description" content="Step-by-step to get started with Dicta-Notes: core features, quick start, user type settings, collaboration basics, and language preferences." />
        <meta property="og:title" content="Getting Started Guide - Dicta-Notes" />
        <meta property="og:description" content="Learn what Dicta-Notes does, how to start your first recording, set your user type, and use language features and sessions." />
      </Helmet>
      
      {/* Article Schema for SEO */}
      <SchemaMarkup 
        type="Article"
        data={{
          headline: "Getting Started with Dicta-Notes",
          description: "Step-by-step guide to get started with Dicta-Notes: core features, quick start, user type settings, collaboration basics, and language preferences.",
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

          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Getting Started</h1>
          <p className="text-muted-foreground mb-6">Your AI-powered meeting companion for transcription, speakers, translation, and exports.</p>

          <div className="space-y-6">
            {/* What is Dicta-Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Welcome to Dicta-Notes</CardTitle>
                <CardDescription>Your AI-powered meeting transcription and document workflow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Dicta-Notes helps you capture meetings, automatically differentiate speakers, translate to 130+ languages, and export professional results. 
                  Transcription is processed on saved sessions with Google Gemini 2.5 for high accuracy and 10+ speaker identification.
                </p>

                <h3 className="text-lg font-medium">Key Features</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Universal transcription (on save)</strong> — Process with Google Gemini 2.5 and identify 10+ speakers</li>
                  <li><strong>Real-time on-screen words</strong> — Immediate feedback while recording</li>
                  <li><strong>Translation</strong> — View or export in 130+ languages</li>
                  <li><strong>Session management</strong> — Organize, filter, and revisit your meetings</li>
                  <li><strong>Exports</strong> — PDF, Word (.docx), Text, Markdown</li>
                  <li><strong>Company workspaces</strong> — Team collaboration with invitations and permissions</li>
                  <li><strong>Document Analysis</strong> — Coming soon</li>
                </ul>
              </CardContent>
            </Card>

            {/* Quick Start Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
                <CardDescription>Get to your first transcript fast</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal pl-6 space-y-2">
                  <li><strong>Set your User Type</strong> in Profile Settings (see below)</li>
                  <li>Open the <strong>Transcribe</strong> page and start recording</li>
                  <li>Stop and <strong>Save Session</strong> when finished</li>
                  <li>Open the saved session and click <strong>Transcribe</strong> to process with Google Gemini 2.5</li>
                  <li>Optionally translate, then export as PDF/Word/Text/Markdown</li>
                </ol>
              </CardContent>
            </Card>

            {/* User Type Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Important: User Type Settings</CardTitle>
                <CardDescription>Choose the right classification before starting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Your User Type determines how Dicta-Notes handles data processing, compliance, and professional responsibilities.</p>

                <div className="space-y-4">
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-green-700">Standard User (Personal Notes)</h4>
                    <ul className="list-disc pl-6 space-y-1 text-sm mt-2">
                      <li>Personal notes and reminders</li>
                      <li>Internal team meetings</li>
                      <li>Education or personal productivity</li>
                      <li>Non-client-facing conversations</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-blue-700">Freelancer / Note‑taker (Professional Services)</h4>
                    <ul className="list-disc pl-6 space-y-1 text-sm mt-2">
                      <li>Legal/court reporting</li>
                      <li>Professional note‑taking for clients</li>
                      <li>Medical/healthcare documentation</li>
                      <li>Billable transcription services</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded">
                  <h4 className="font-semibold mb-2">Why this matters</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                    <li>Compliance and data handling</li>
                    <li>Retention and quality standards</li>
                    <li>Feature access optimized for your role</li>
                  </ul>
                </div>

                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-semibold mb-2">How to set your User Type</h4>
                  <ol className="list-decimal pl-6 space-y-1 text-sm">
                    <li>Open <strong>Profile</strong> (user menu, top‑right)</li>
                    <li>Go to the <strong>Features</strong> tab</li>
                    <li>Select your User Type and save</li>
                    <li>Applies to future sessions you create</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Collaboration & Online Meetings (no dev-only live sharing claims) */}
            <Card>
              <CardHeader>
                <CardTitle>Collaboration & Online Meetings</CardTitle>
                <CardDescription>Work with your team and capture virtual meetings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <h4 className="font-semibold">Company Workspaces</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Create shared workspaces for your organization</li>
                  <li>Invite teammates and manage permissions</li>
                  <li>Saved sessions are accessible to authorized members</li>
                </ul>
                <h4 className="font-semibold mt-2">Online Meeting Integration</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Capture audio from Zoom, Teams, Google Meet via your browser</li>
                  <li>Use System/Tab Audio and enable “Share audio” when prompted</li>
                  <li>See the Video Meetings Guide for platform‑specific tips</li>
                </ul>
              </CardContent>
            </Card>

            {/* Language Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Language Preferences</CardTitle>
                <CardDescription>Personalized translation experience</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Set your preferred language in account settings</li>
                  <li>AI detects spoken language automatically</li>
                  <li>Translate transcripts and exports to your preferred language</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}
