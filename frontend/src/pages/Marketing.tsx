import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Users, FileText, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

const featureHighlights = [
  {
    icon: <Lightbulb className="h-8 w-8 text-blue-500" />,
    title: "Never Lose a Creative Idea",
    description: "Capture every brainstorm, every spark of creativity. Our AI transcribes your sessions so brilliant ideas never slip through the cracks.",
  },
  {
    icon: <Users className="h-8 w-8 text-green-500" />,
    title: "Multilingual Team Collaboration",
    description: "Work seamlessly with creative teams across languages. Real-time transcription supports 130+ languages for true global collaboration.",
  },
  {
    icon: <FileText className="h-8 w-8 text-yellow-500" />,
    title: "Automated Meeting Documentation",
    description: "Focus on the creative flow while we handle the notes. Get speaker-identified transcripts of every campaign review and ideation session.",
  },
  {
    icon: <Globe className="h-8 w-8 text-purple-500" />,
    title: "Searchable Creative Archive",
    description: "Build a knowledge base of creative decisions. Easily search past brainstorms to find that perfect concept you discussed months ago.",
  },
];

const faqItems = [
  {
    question: "How does this help with creative brainstorming sessions?",
    answer: "During brainstorming, ideas flow fast. Dicta-Notes captures every suggestion and concept automatically, so your team can stay in creative flow without worrying about note-taking. Review the full transcript later to identify the best ideas."
  },
  {
    question: "Can we use this for client presentations and feedback sessions?",
    answer: "Absolutely! Record client meetings, design critiques, and feedback sessions. You'll have an accurate record of client requests, creative direction, and approval decisions - perfect for reference and accountability."
  },
  {
    question: "What about multilingual teams?",
    answer: "Dicta-Notes supports 130+ languages with speaker identification. If your creative team spans multiple countries, everyone can participate in their preferred language, and the transcript captures it all."
  },
  {
    question: "How secure is our creative content?",
    answer: "All transcripts are encrypted and stored securely using Firebase infrastructure. Your creative concepts, campaign ideas, and client discussions remain confidential and protected."
  }
];

export default function Marketing() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Marketing Page', { language: 'en', niche: 'marketing' });
  }, []);

  const handleStartTranscribing = () => {
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="en" />
        <title>Dicta-Notes for Marketing & Creative Teams | AI Meeting Transcription</title>
        <meta name="description" content="AI-powered transcription for marketing teams and creative professionals. Never lose a brilliant idea from brainstorming sessions. Perfect for campaign planning, design reviews, and multilingual collaboration." />
        <meta name="keywords" content="marketing transcription, creative team meetings, brainstorming documentation, campaign planning notes, design review transcription, multilingual marketing teams" />
        <link rel="canonical" href="https://dicta-notes.com/marketing" />
        
        {/* Hreflang tags for marketing pages */}
        <link rel="alternate" hrefLang="en" href="https://dicta-notes.com/marketing" />
        <link rel="alternate" hrefLang="fr" href="https://dicta-notes.com/marketing-fr" />
        <link rel="alternate" hrefLang="es" href="https://dicta-notes.com/marketing-es" />
        <link rel="alternate" hrefLang="de" href="https://dicta-notes.com/marketing-de" />
        <link rel="alternate" hrefLang="el" href="https://dicta-notes.com/marketing-el" />
        <link rel="alternate" hrefLang="ko" href="https://dicta-notes.com/marketing-ko" />
        <link rel="alternate" hrefLang="x-default" href="https://dicta-notes.com/marketing" />

        {/* Open Graph */}
        <meta property="og:title" content="Dicta-Notes for Marketing & Creative Teams" />
        <meta property="og:description" content="AI transcription for brainstorming, campaign planning, and creative reviews. Never lose a great idea." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/marketing" />
        <meta property="og:locale" content="en_US" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes for Marketing Teams",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "en",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "AI-powered meeting transcription for marketing and creative teams. Capture brainstorming sessions, campaign planning, and design reviews with speaker identification in 130+ languages.",
            "audience": {
              "@type": "BusinessAudience",
              "name": "Marketing and Creative Professionals"
            }
          })}
        </script>
      </Helmet>
      <Header />

      <div className="bg-background text-foreground">
        {/* Hero Section */}
        <section className="text-center py-20 px-4 bg-gray-50 dark:bg-gray-900">
          <h1 className="text-4xl md:text-5xl font-bold">
            Capture Every Creative Spark
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Dicta-Notes transforms your brainstorming sessions and creative meetings into searchable, actionable documentation. Focus on innovation while AI handles the notes.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={handleStartTranscribing}>
              Start Free Trial
            </Button>
          </div>
        </section>

        {/* Translate Feature Notice */}
        <section className="py-8 px-4 bg-blue-50 dark:bg-blue-950/20">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-start">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100">💡 Tip: Translate the App</p>
                <p className="text-blue-800 dark:text-blue-200 mt-1">
                  When you click "Start Free Trial" and access the app, the interface may be in English. You can easily translate it to any of 130+ languages by clicking the translate button (globe icon 🌐) in the header at the top of the page.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-16 px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold">Are Brilliant Ideas Slipping Away?</h2>
            <p className="text-muted-foreground mt-4">
              Fast-paced creative sessions generate amazing concepts, but manual note-taking kills momentum and great ideas get lost in scattered notes.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Lost Creative Ideas</CardTitle>
              </CardHeader>
              <CardContent>
                <p>During intense brainstorming, someone's always scrambling to take notes. Great concepts slip away because no one captured them properly.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Scattered Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Campaign decisions and creative direction end up in random notebooks, incomplete Google docs, or worse - just in people's memories.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Language Barriers</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Global creative teams struggle when meetings mix multiple languages, making it hard to capture everyone's contributions accurately.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Built for Creative Flow</h2>
            <p className="text-muted-foreground mt-2">
              Designed for marketing teams and creative professionals who need to move fast without losing ideas.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12 max-w-6xl mx-auto">
            {featureHighlights.map((feature, index) => (
              <div key={index} className="flex flex-col items-center text-center p-4">
                {feature.icon}
                <h3 className="text-xl font-semibold mt-4">{feature.title}</h3>
                <p className="text-muted-foreground mt-2">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Use Case Scenarios */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Perfect For Your Creative Workflow</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Brainstorming</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Capture every concept, tagline, and creative direction during campaign ideation. Review the full transcript to cherry-pick the best ideas and build comprehensive briefs.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Design Critiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Document all feedback from design reviews. Keep a clear record of what worked, what didn't, and the reasoning behind creative decisions.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Client Presentations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Record client feedback sessions to ensure nothing gets missed. Have an accurate reference for revisions, approvals, and scope discussions.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Content Planning</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Turn strategy meetings into searchable content calendars. Never wonder "who suggested that topic?" or "what was the angle we discussed?"</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Questions from Creative Teams</h2>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{item.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-4 text-center bg-purple-600 text-white">
          <h2 className="text-3xl font-bold">Ready to Never Lose Another Great Idea?</h2>
          <p className="mt-4 max-w-2xl mx-auto">
            Join creative teams worldwide who use AI transcription to capture, organize, and act on their best ideas.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={handleStartTranscribing}>
              Start Free Trial Now
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-purple-600" onClick={() => navigate("/pricing")}>
              See Pricing
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
