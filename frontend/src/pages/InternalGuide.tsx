import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function InternalGuide() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Internal Feature Guide</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
            Complete audit of all public-facing features in Dicta-Notes. For internal use only.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Last updated: October 18, 2025
          </p>
        </header>

        <div className="space-y-8">
          {/* Three Core Engines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-blue-700 dark:text-blue-400">⚙️ Three Core Engines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">1. Browser Speech Recognition</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><Badge variant="secondary">Purpose:</Badge> Real-time UX feedback during recording</li>
                  <li><Badge variant="secondary">Strength:</Badge> Instant visual feedback, no server round-trip</li>
                  <li><Badge variant="secondary">Limitation:</Badge> UX display only, not used for final transcription</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">2. Google Gemini 2.5</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><Badge variant="secondary">Purpose:</Badge> Powerful AI transcription and processing</li>
                  <li><Badge variant="secondary">Strength:</Badge> Extremely powerful in virtually all languages</li>
                  <li><Badge variant="secondary">Use Cases:</Badge> On-demand transcription, speaker identification, language detection, meeting summaries</li>
                  <li><Badge variant="secondary">Models:</Badge> Primary on-demand jobs use <strong>Gemini 2.5 Flash</strong>; <strong>Gemini 2.5 Pro</strong> appears in select API/worker paths (e.g. legacy or alternate transcription handlers).</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">3. Google Translation</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><Badge variant="secondary">Purpose:</Badge> Text translation between languages</li>
                  <li><Badge variant="secondary">Strength:</Badge> Gold standard for translating text</li>
                  <li><Badge variant="secondary">Coverage:</Badge> 130+ languages supported</li>
                  <li><Badge variant="secondary">Use Cases:</Badge> Translate transcripts, real-time translation, multi-language support</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Production Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-green-700 dark:text-green-400">✅ Live in Production</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">1. Authentication & Onboarding</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><Badge variant="secondary">Sign-up:</Badge> Email/password or Google OAuth</li>
                  <li><Badge variant="secondary">Login:</Badge> Secure Firebase authentication</li>
                  <li><Badge variant="secondary">Password Reset:</Badge> Available via "Forgot Password" link</li>
                  <li><Badge variant="secondary">Session Persistence:</Badge> Users stay logged in across sessions</li>
                  <li><Badge variant="secondary">Terms & Privacy:</Badge> Required acceptance during signup</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">2. Core Recording Architecture (Dual-Layer)</h3>
                <p className="mb-2"><Badge>Architecture:</Badge> Two-layer system for optimal UX and reliability</p>
                <div className="ml-4 space-y-2">
                  <div>
                    <p className="font-semibold">Layer 1: Browser Speech (UX)</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Real-time visual feedback during recording</li>
                      <li>Client-side speech recognition</li>
                      <li>Display only - no audio recording</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold">Layer 2: Traditional System (Backbone)</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Records entire meeting audio</li>
                      <li>Saves raw audio to Firestore</li>
                      <li>Creates session document with metadata</li>
                      <li>Handles audio capture and storage</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">3. Complete Recording Flow (/transcribe)</h3>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Navigate to <code>/transcribe</code></li>
                  <li>Fill meeting details: Title (required), Purpose, Project, Tags</li>
                  <li>Select audio source: 🎤 Microphone or 🖥️ System/Tab Audio</li>
                  <li>Click "Start Recording"</li>
                  <li>Browser Speech shows live text (UX feedback)</li>
                  <li>Traditional system records audio in background</li>
                  <li>Click "Stop & Save"</li>
                  <li>Audio + metadata saved to Firestore</li>
                  <li>Session created for later processing</li>
                </ol>
              </div>

              <Separator />

              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">4. Session Management (/sessions)</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><Badge variant="secondary">View All Sessions:</Badge> Browse all saved recordings</li>
                  <li><Badge variant="secondary">Filter Options:</Badge> Client, Project, Tags, Notes</li>
                  <li><Badge variant="secondary">Four Tabs:</Badge> All Sessions, With Documents, With Audio, <span className="font-medium">Upload Audio/Video</span></li>
                  <li><Badge variant="secondary">Session Detail:</Badge> Click "View Details" to open individual session</li>
                  <li><Badge variant="secondary">Edit Speakers:</Badge> Rename speaker labels after recording</li>
                </ul>
                <div className="mt-3 ml-4 p-3 rounded border bg-gray-50 dark:bg-zinc-900">
                  <p className="text-sm font-semibold mb-1">New: Upload Audio/Video tab</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Accepts audio (mp3, wav, m4a, webm, ogg, flac) and video (mp4, mov, avi, webm, mkv)</li>
                    <li>Drag-and-drop or file picker with validation and progress bar</li>
                    <li>Metadata fields: Title (required), Client, Project, Purpose, Tags</li>
                    <li>Video files automatically processed for audio only (extraction step shown)</li>
                    <li>Tier-aware limits with clear error messages and upgrade prompt</li>
                    <li>On success, auto-navigates to the new Session Detail page</li>
                  </ul>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">5. On-Demand Transcription</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><Badge variant="secondary">Trigger Processing:</Badge> Navigate to session detail page</li>
                  <li><Badge variant="secondary">Google Gemini 2.5:</Badge> Transcribes saved audio with speaker identification</li>
                  <li><Badge variant="secondary">View Results:</Badge> Transcript, audio playback, notes, documents</li>
                  <li><Badge variant="secondary">Translation:</Badge> Translate to any of 130+ languages</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">6. Export Options</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><Badge variant="secondary">PDF:</Badge> Professional formatted document</li>
                  <li><Badge variant="secondary">Word:</Badge> Editable .docx format</li>
                  <li><Badge variant="secondary">Text:</Badge> Plain text export</li>
                  <li><Badge variant="secondary">Markdown:</Badge> Formatted markdown file</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">7. User Settings (/settings)</h3>
                <div className="ml-4 space-y-2">
                  <p className="font-semibold">Four Main Tabs:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><Badge variant="secondary">Features:</Badge> Module enable/disable toggles</li>
                    <li><Badge variant="secondary">Profile:</Badge> User type (Standard/Freelancer)</li>
                    <li><Badge variant="secondary">Security:</Badge> Change password</li>
                    <li><Badge variant="secondary">Appearance:</Badge> Theme (Light/Dark/System)</li>
                  </ul>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">8. PWA Installation (/install)</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><Badge variant="secondary">Platform Guides:</Badge> Desktop (Chrome/Edge/Brave, Firefox, Safari) and Mobile (Android/iOS)</li>
                  <li><Badge variant="secondary">Benefits:</Badge> Offline access, faster performance, app-like experience</li>
                  <li><Badge variant="secondary">Features:</Badge> Background sync, service worker caching</li>
                  <li><Badge variant="secondary">Standalone Mode:</Badge> Opens as app without browser UI</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">9. Freelancer Features</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><Badge variant="secondary">User Type:</Badge> Set in Settings → Profile tab</li>
                  <li><Badge variant="secondary">Extra Fields:</Badge> Client Name and Notes appear on Transcribe page</li>
                  <li><Badge variant="secondary">Client Management:</Badge> Track sessions by client</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">10. Public Static Pages</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><Badge variant="secondary">Home:</Badge> Landing page with app introduction</li>
                  <li><Badge variant="secondary">Contact:</Badge> Support form with enterprise SEO</li>
                  <li><Badge variant="secondary">About:</Badge> Mission statement with beta banner</li>
                  <li><Badge variant="secondary">Privacy, Terms, Cookie Policy:</Badge> Legal documentation</li>
                  <li><Badge variant="secondary">Instructions:</Badge> Getting started guide</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">11. Schema.org & SEO</h3>
                <p className="mb-2"><Badge>Strategy:</Badge> Use a centralized `SchemaMarkup.tsx` component to manage all structured data, preventing fragmentation and ensuring consistency.</p>
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-sm font-semibold">Homepage `SoftwareApplication` Implementation:</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">The main application schema is now defined in `App.tsx` and passed to the `SchemaMarkup` component. This is the single source of truth for our app's structured data.</p>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-auto">
                    <code>
{`
<SchemaMarkup
  type="SoftwareApplication"
  data={{
    '@id': 'https://dicta-notes.com/#softwareapplication',
    name: 'Dicta-Notes',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'TranscriptionTool',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '128',
    },
    description: "...",
    featureList: ["...", "...", "..."],
    keywords: "...",
    sameAs: ['https://dicta-notes.com'],
    additionalProperty: [{...}]
  }}
/>
`}
                    </code>
                  </pre>
                </div>
              </div>
              
              <Separator />

              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">12. Multilingual Landing Pages</h3>
                <p className="mb-2"><Badge>SEO Strategy:</Badge> 16 language-specific landing pages for international search visibility</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><Badge variant="secondary">European Languages:</Badge> French (/french), Spanish (/spanish), German (/german), Portuguese (/portuguese), Russian (/russian)</li>
                  <li><Badge variant="secondary">Asian Languages:</Badge> Chinese (/chinese), Japanese (/japanese), Korean (/korean), Hindi (/hindi), Malay (/malay)</li>
                  <li><Badge variant="secondary">African Languages:</Badge> Afrikaans (/afrikaans), Swahili (/swahili), Hausa (/hausa), Yoruba (/yoruba), Zulu (/zulu)</li>
                  <li><Badge variant="secondary">Middle Eastern:</Badge> Arabic (/arabic)</li>
                </ul>
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-sm font-semibold">Each page includes:</p>
                  <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                    <li>Fully translated content in native language</li>
                    <li>Schema.org structured data (now centralized via `SchemaMarkup`)</li>
                    <li>Hreflang tags linking to all other language versions</li>
                    <li>Language switcher for easy navigation</li>
                    <li>Direct "Start Transcribing" button that sets language preference</li>
                    <li>SEO optimized with localized meta tags</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* NOT Available in Production */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-red-700 dark:text-red-400">❌ NOT Available to Public (Dev/Testing Only)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Disabled Features</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><Badge variant="destructive">Gemini Live:</Badge> Explicitly disabled in production code (dev only)</li>
                  <li><Badge variant="destructive">Google STT:</Badge> Testing/development only</li>
                  <li><Badge variant="destructive">Create Shareable Link:</Badge> Hidden in production UI</li>
                  <li><Badge variant="destructive">Participants Card:</Badge> Hidden in production UI</li>
                  <li><Badge variant="destructive">Live Session Sharing:</Badge> Development only</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Test/Debug Pages (All Protected)</h3>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <code className="text-sm">/admin-speech-test</code>
                  <code className="text-sm">/audio-captain-test</code>
                  <code className="text-sm">/gemini-live-simple-test</code>
                  <code className="text-sm">/google-stt-test</code>
                  <code className="text-sm">/memory-cleanup-test</code>
                  <code className="text-sm">/mic-vad-test</code>
                  <code className="text-sm">/storage-cleanup</code>
                  <code className="text-sm">/stream-cloning-test</code>
                  <code className="text-sm">/timer-test</code>
                  <code className="text-sm">/transcription-test</code>
                  <code className="text-sm">/v2architecture-test</code>
                  <code className="text-sm">/debug-mode</code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Stack */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-purple-700 dark:text-purple-400">🔧 Technical Stack</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <ul className="list-disc list-inside space-y-1">
                  <li><Badge variant="secondary">Frontend:</Badge> React + TypeScript + Vite</li>
                  <li><Badge variant="secondary">Backend:</Badge> Python + FastAPI</li>
                  <li><Badge variant="secondary">Database:</Badge> Firebase Firestore</li>
                  <li><Badge variant="secondary">Authentication:</Badge> Firebase Auth</li>
                  <li><Badge variant="secondary">Transcription (UX):</Badge> Browser SpeechRecognition API</li>
                  <li><Badge variant="secondary">Transcription (AI):</Badge> Google Gemini 2.5</li>
                  <li><Badge variant="secondary">Translation:</Badge> Google Translation API</li>
                  <li><Badge variant="secondary">PWA:</Badge> Service workers + manifest</li>
                  <li><Badge variant="secondary">UI Components:</Badge> shadcn/ui + Tailwind CSS</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-500">
          <p>This guide is maintained by the development team and reflects the current state of production.</p>
          <p className="mt-1">For questions or updates, contact the project maintainer.</p>
        </footer>
      </div>
    </div>
  );
}
