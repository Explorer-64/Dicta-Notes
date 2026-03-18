import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Header } from "components/Header";
import { HomeFooter } from "components/HomeFooter";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";
import { SEOMetaTags, seoConfigs } from "components/SEOMetaTags";
import { SchemaMarkup } from 'components/SchemaMarkup';
import { ModeDetectionTest } from "../components/ModeDetectionTest";
import { Toaster } from "@/components/ui/sonner";
import {
  ArrowRight,
  HandHeart,
  MonitorSpeaker,
  Users,
  Languages,
  Briefcase,
  Plus,
  Bot,
  History,
  Download,
  Save,
  Shield,
  Smartphone,
  Zap,
  MoreHorizontal,
  BookOpen,
  Trophy,
} from "lucide-react";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Track page view when component mounts
  useEffect(() => {
    logPageView("Home");
  }, []);

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Dicta-Notes",
    applicationCategory: "BusinessApplication",
    operatingSystem: "iOS, Android, Windows, macOS, Linux",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "124",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: "0",
      category: "Free",
    },
  };

  return (
    <div className="flex flex-col min-h-screen" itemScope itemType="https://schema.org/WebPage" itemID="https://dicta-notes.com/#webpage">
      <SEOMetaTags {...seoConfigs.home} />
      <SchemaMarkup type="SoftwareApplication" data={softwareApplicationSchema} />
      <Helmet>
        {/* Critical CSS for mobile performance */} 
        <style>{`
          /* Inline critical font styles for instant rendering */
          body { font-family: 'Inter', 'system-ui', -apple-system, sans-serif; font-display: swap; }
          /* Critical hero section styles - prevent layout shift */
          .hero-section { min-height: 50vh; }
          .hero-gradient { background: linear-gradient(135deg, rgb(239 246 255) 0%, rgb(238 242 255) 50%, rgb(250 245 255) 100%); }
          /* Preload critical font weights */
          @font-face { font-family: 'Inter'; src: local('Inter'); font-display: swap; }
        `}</style>
        <title>Dicta-Notes | AI-Powered Real-Time Meeting Transcription</title>
        <meta name="description" content="Mobile-first PWA for meeting transcription. Works offline with zero setup. Install on any device for instant access. AI-powered real-time transcription with 10+ speaker identification, translation to 130+ languages, and secure cloud sync. Export to PDF, Word, Text, and Markdown." />
        <meta name="keywords" content="pwa meeting transcription, offline transcription app, mobile meeting notes, install transcription app, speaker identification 10+, translate 130+ languages, export pdf word text markdown, works offline, progressive web app, mobile-first transcription" />
        <link rel="canonical" href="https://dicta-notes.com" />
        
        {/* Hreflang tags */}
        <link rel="alternate" hrefLang="x-default" href="https://dicta-notes.com" />
        <link rel="alternate" hrefLang="en" href="https://dicta-notes.com" />
        <link rel="alternate" hrefLang="es" href="https://dicta-notes.com/spanish" />
        <link rel="alternate" hrefLang="fr" href="https://dicta-notes.com/french" />
        <link rel="alternate" hrefLang="de" href="https://dicta-notes.com/german" />
        <link rel="alternate" hrefLang="pt" href="https://dicta-notes.com/portuguese" />
        <link rel="alternate" hrefLang="zh" href="https://dicta-notes.com/chinese" />
        <link rel="alternate" hrefLang="ja" href="https://dicta-notes.com/japanese" />
      </Helmet>

      <Header />
      
      {/* Hero Section */}
      <section className="hero-section relative py-12 sm:py-20 md:py-32 overflow-hidden" role="banner" aria-labelledby="hero-heading">
        {/* Mobile background - optimized hero image for mobile with fetchpriority */}
        <img
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop&auto=format&fm=webp&q=75"
          alt=""
          fetchpriority="high"
          className="absolute inset-0 z-0 md:hidden w-full h-full object-cover"
          style={{
            opacity: 0.15,
            mixBlendMode: 'multiply'
          }}
        />
        
        {/* Desktop background - original hero image with fetchpriority */}
        <img
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
          alt=""
          fetchpriority="high"
          className="absolute inset-0 z-0 hidden md:block w-full h-full object-cover"
          style={{
            opacity: 0.20
          }}
        />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h1 id="hero-heading" className="text-3xl sm:text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl mb-4 sm:mb-6" itemProp="headline">
            <span className="block">AI Notes That Go Anywhere</span>
            <span className="block text-primary">In Any Language with Speaker ID</span>
          </h1>
          <div className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-muted-foreground" itemProp="description">
           Record meetings on any device, even offline. Our app automatically detects the spoken language and delivers an AI-powered transcript, ready to translate into 130+ languages.
          </div>
          <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
            <Button 
              size="lg" 
              className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg shadow-lg mb-3 sm:mb-0 bg-yellow-500 text-black hover:bg-yellow-600" 
              onClick={() => navigate("/transcribe")}
            >
              Start Now
            </Button>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg"
                onClick={() => navigate("/ai-benefits")}
              >
                Learn More
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg"
                onClick={() => navigate("/comparison")}
              >
                Compare Features
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
       <section className="py-10 sm:py-16 bg-muted/50" role="region" aria-labelledby="features-heading" itemScope itemType="https://schema.org/ItemList" itemProp="mainEntity">
        <div className="container mx-auto px-4">
          <h2 id="features-heading" className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12" itemProp="name">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-6 shadow-sm flex flex-col items-center text-center">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <MonitorSpeaker className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant On-Screen Feedback</h3>
              <p className="text-muted-foreground">See your words appear on-screen as you speak, ensuring your meeting is being captured.</p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-sm flex flex-col items-center text-center">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Advanced Speaker ID</h3>
              <p className="text-muted-foreground">AI identifies up to 10 speakers with industry-leading accuracy so you always know who said what.</p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-sm flex flex-col items-center text-center">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <Languages className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multi-Language Translation</h3>
              <p className="text-muted-foreground">Translate your final transcript into over 130 languages to include global team members.</p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-sm flex flex-col items-center text-center">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Company Workspaces</h3>
              <p className="text-muted-foreground">Create a central hub for your team, manage user permissions, and streamline collaboration.</p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-sm flex flex-col items-center text-center">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">User Invitation System</h3>
              <p className="text-muted-foreground">Easily invite team members to join your company workspace with secure email invitations.</p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-sm flex flex-col items-center text-center">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">On-Demand Transcription</h3>
              <p className="text-muted-foreground">Process your recordings with Gemini 2.5 Pro for highly accurate transcription and speaker identification.</p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-sm flex flex-col items-center text-center">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <History className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Session Management</h3>
              <p className="text-muted-foreground">Save, organize, and search through your meeting history with powerful and secure tools.</p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-sm flex flex-col items-center text-center">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multiple Export Options</h3>
              <p className="text-muted-foreground">Export transcripts in TXT, DOCX, and Markdown formats for maximum flexibility.</p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-sm flex flex-col items-center text-center">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <Save className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Automatic Saving & Offline</h3>
              <p className="text-muted-foreground">Never lose work with automatic saving every 30 seconds and reliable offline support.</p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-sm flex flex-col items-center text-center">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">Your data is encrypted and stored securely using Firebase, giving you full control.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PWA Install Section */}
      <section className="py-10 sm:py-16 bg-primary/5" aria-labelledby="pwa-install-heading">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Smartphone className="h-6 w-6 text-primary" />
            <h2 id="pwa-install-heading" className="text-2xl sm:text-3xl font-bold">Install Dicta-Notes on Your Device</h2>
          </div>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground mb-8">
            Dicta-Notes works offline! Install it on your device for faster access and use without an internet connection. No app store required.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mb-8 max-w-4xl mx-auto">
            <div className="flex items-center p-5 bg-card rounded-lg shadow-sm border gap-3 flex-1 min-w-[220px] max-w-[280px]">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-medium mb-1">Secure Offline Access</h3>
                <p className="text-sm text-muted-foreground">Your data stays on your device</p>
              </div>
            </div>
            <div className="flex items-center p-5 bg-card rounded-lg shadow-sm border gap-3 flex-1 min-w-[220px] max-w-[280px]">
              <Zap className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-medium mb-1">Lightning Fast</h3>
                <p className="text-sm text-muted-foreground">Loads instantly, even offline</p>
              </div>
            </div>
            <div className="flex items-center p-5 bg-card rounded-lg shadow-sm border gap-3 flex-1 min-w-[220px] max-w-[280px]">
              <MoreHorizontal className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-medium mb-1">App-Like Experience</h3>
                <p className="text-sm text-muted-foreground">Works just like a native app</p>
              </div>
            </div>
          </div>
          <div className="max-w-xl mx-auto bg-card rounded-lg border p-4 mb-6">
            <h3 className="font-medium mb-2">How to Install:</h3>
            <p className="text-sm text-muted-foreground mb-2">Look for the install icon in your browser's address bar or menu:</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="bg-background p-2 rounded-md">Chrome/Edge: <span className="font-mono">⋮</span> → Install Dicta-Notes</div>
              <div className="bg-background p-2 rounded-md">Firefox: <span className="font-mono">≡</span> → Install</div>
              <div className="bg-background p-2 rounded-md">Safari (iOS): Share → Add to Home Screen</div>
              <div className="bg-background p-2 rounded-md">Android: <span className="font-mono">⋮</span> → Install app</div>
            </div>
          </div>
          <Button
            className="gap-2"
            variant="outline"
            size="lg"
            onClick={() => navigate('/install')}
          >
            Detailed Installation Instructions
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* How to Use Section - NEW */}
      <section className="py-10 sm:py-16 bg-card" role="region" aria-labelledby="how-to-use-heading" itemScope itemType="https://schema.org/HowTo" itemProp="mainEntity">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-8">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 id="how-to-use-heading" className="text-2xl sm:text-3xl font-bold text-center" itemProp="name">How It Works: Simple & Powerful</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="border rounded-lg p-6 bg-background" itemScope itemType="https://schema.org/HowToStep" itemProp="step">
              <h3 className="font-medium text-xl mb-4 flex items-center" itemProp="name">
                <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center mr-2">
                  1
                </div>
                Record
              </h3>
              <div className="text-muted-foreground">
                Go to the Transcribe page and click "Start Recording" to begin capturing your meeting.
              </div>
            </div>
            <div className="border rounded-lg p-6 bg-background" itemScope itemType="https://schema.org/HowToStep" itemProp="step">
              <h3 className="font-medium text-xl mb-4 flex items-center" itemProp="name">
                <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center mr-2">
                  2
                </div>
                Review
              </h3>
              <div className="text-muted-foreground">
                 Review the instant on-screen text and manage speaker names as the meeting progresses.
              </div>
            </div>
            <div className="border rounded-lg p-6 bg-background" itemScope itemType="https://schema.org/HowToStep" itemProp="step">
              <h3 className="font-medium text-xl mb-4 flex items-center" itemProp="name">
                <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center mr-2">
                  3
                </div>
                Translate & Export
              </h3>
              <div className="text-muted-foreground">
                Translate the final transcript into 130+ languages and export to PDF, Word, Markdown, or plain text.
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              size="lg"
              className="gap-2"
              onClick={() => navigate("/instructions")}
            >
              View Detailed Instructions
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Use Cases Sectio */}
      <section className="py-10 sm:py-16" role="region" aria-labelledby="use-cases-heading" itemScope itemType="https://schema.org/ItemList" itemProp="mainEntity">
        <div className="container mx-auto px-4">
          <h2 id="use-cases-heading" className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12" itemProp="name">Perfect For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6" itemScope itemType="https://schema.org/ListItem" itemProp="itemListElement">
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2" itemProp="name">Business Meetings</h3>
              <p className="text-muted-foreground" itemProp="description">Capture every insight and decision without the distraction of taking notes. Focus on the conversation, not documentation.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2H-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Interviews & Research</h3>
              <p className="text-muted-foreground">Accurately document responses and insights without breaking your concentration or missing important details.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
              <p className="text-muted-foreground">Invite team members to your company workspace, set custom permissions, and collaborate on meeting transcriptions securely.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <Save className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Auto-Saving & Offline</h3>
              <p className="text-muted-foreground">Never lose work with automatic saving every 30 seconds and offline support that lets you keep recording even without internet.</p>
            </div>

            {/* Sports Associations */}
            <div className="flex flex-col items-center text-center p-6">
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sports Associations</h3>
              <p className="text-muted-foreground">Streamline board meetings and record keeping for community sports organizations with minimal volunteer burden.</p>
              <Button 
                variant="link" 
                className="mt-3 p-0 h-auto" 
                onClick={() => navigate('/non-profit-solutions')}
              >
                Learn more
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            {/* Non-Profit Organizations */}
            <div className="flex flex-col items-center text-center p-6">
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 mb-4">
                <HandHeart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Non-Profits</h3>
              <p className="text-muted-foreground">Affordable solution for volunteer-run organizations that need consistent meeting documentation without administrative burden.</p>
              <Button 
                variant="link" 
                className="mt-3 p-0 h-auto" 
                onClick={() => navigate('/non-profit-solutions')}
              >
                Learn more
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - NEW */}
      <section className="py-10 sm:py-16" aria-labelledby="faq-heading">
        <div className="container mx-auto px-4">
          <h2 id="faq-heading" className="text-2xl sm:text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>

          <div className="max-w-3xl mx-auto space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">How accurate is Dicta-Notes transcription?</h3>
              <p className="text-muted-foreground">
                Dicta-Notes achieves up to 98% accuracy in quiet environments with clear speech. This accuracy can vary based on factors like background noise, speaker clarity, and accents. Our advanced AI continuously improves with each transcription.                
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">How many speakers can it identify?</h3>
              <p className="text-muted-foreground">
                Dicta-Notes, leveraging advanced AI, can identify 10 or more distinct speakers. For best results, having speakers introduce themselves at the beginning of the meeting helps the AI more accurately assign names to voices.                
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">How secure are my transcriptions?</h3>
              <p className="text-muted-foreground">
                Dicta-Notes uses Firebase secure storage with 256-bit encryption for all transcriptions. Your data is stored in compliance with industry security standards, and you retain full control over your transcriptions with the ability to delete them at any time.              
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Demo Section for AI Learning - NEW */}
      <section className="py-10 sm:py-16 bg-card/50" aria-labelledby="demo-heading">
        <div className="container mx-auto px-4">
          <h2 id="demo-heading" className="text-2xl sm:text-3xl font-bold text-center mb-6">See Dicta-Notes in Action</h2>
          <p className="text-center text-muted-foreground max-w-3xl mx-auto mb-8">
            Here's a sample of how Dicta-Notes transcribes conversations with multiple speakers in real-time.
          </p>

          <div className="max-w-3xl mx-auto border rounded-lg bg-background p-4 sm:p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Sample Meeting Transcript: Product Team Weekly</h3>

            <div className="space-y-4 mb-4">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">Speaker 1: Sarah (Product Manager)</div>
                <p>Welcome everyone to our weekly product meeting. Today we'll be discussing the new feature requests and prioritizing our roadmap for Q3. Alex, can you start by sharing the user feedback summary?</p>
              </div>

              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                <div className="font-medium text-green-700 dark:text-green-300 mb-1">Speaker 2: Alex (UX Researcher)</div>
                <p>Thanks Sarah. Based on our user interviews, the top requested features are: offline mode, improved export options, and better integration with calendar apps. Users are particularly vocal about wanting Word document exports.</p>
              </div>

              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <div className="font-medium text-purple-700 dark:text-purple-300 mb-1">Speaker 3: Jamie (Lead Developer)</div>
                <p>I think we should prioritize the offline mode first since it aligns with our Q3 goal of improving reliability. My team can have that ready in about two sprints if we start now.</p>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">Speaker 1: Sarah (Product Manager)</div>
                <p>That makes sense. What about the Word export feature? Is that something we can tackle in parallel or should we sequence these?</p>
              </div>
            </div>

            <div className="text-sm text-muted-foreground italic">
              Meeting duration: 00:42:18 • 4 speakers • 86 segments • Transcribed with Dicta-Notes
            </div>
          </div>
        </div>
      </section>


      <section className="py-10 sm:py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Ready to Transform Your Meetings?</h2>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
            Start transcribing your meetings today and never miss an important detail again.
          </p>
          <Button 
            size="lg" 
           className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg shadow-lg" 
            onClick={() => navigate("/transcribe")}
          >
            Get Started 
          </Button>
        </div>
      </section>
      <HomeFooter />
      <Toaster />
    </div>
  );
}
