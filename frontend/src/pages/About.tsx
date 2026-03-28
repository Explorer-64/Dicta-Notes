import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "components/Header";
import { BackButton } from "components/BackButton";
import { SEOMetaTags, seoConfigs } from "components/SEOMetaTags";
import { logPageView } from "utils/analytics";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function About() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView("About");
  }, []);

  const features = [
    "AI-powered transcription with Google Gemini 2.5 on saved sessions.",
    "Identify over 10 speakers with high accuracy.",
    "Translate transcripts into more than 130 languages.",
    "Export your notes to PDF, Word, Text, or Markdown.",
    "Install as a PWA for offline access and native feel.",
    "Securely manage and access your meeting history from anywhere.",
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SEOMetaTags {...seoConfigs.about} />
      <Header />

      <main className="flex-grow">
        <div className="container mx-auto px-4 pt-4">
          <BackButton />
        </div>
        {/* Hero Section */}
        <section className="bg-muted/30 py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
              Our Mission
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              To empower professionals and teams to have more focused, productive, and inclusive conversations by automating the burden of documentation.
            </p>
          </div>
        </section>

        {/* Problem & Solution Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  The High Cost of Ineffective Meetings
                </h2>
                <p className="text-muted-foreground mb-6">
                  Meetings are essential, but they come with challenges. Manual note-taking is distracting, human transcription is slow and expensive, and valuable insights are often lost the moment the meeting ends. This administrative drag costs businesses time and money.
                </p>
                <ul className="space-y-4">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 className="h-6 w-6 text-primary mr-3 mt-1 flex-shrink-0" />
                      <span className="text-lg text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-card p-8 rounded-lg shadow-sm border">
                <h3 className="text-2xl font-semibold mb-4">The Dicta-Notes Solution</h3>
                <p className="text-muted-foreground">
                  We solve this by combining the best of two worlds: instant on-screen feedback to ensure your conversation is being captured, followed by powerful, on-demand AI processing.
                </p>
                <div className="mt-6 space-y-4">
                  <div>
                    <h4 className="font-semibold text-lg">1. Instant Feedback (UX Layer)</h4>
                    <p className="text-muted-foreground text-sm">
                      Our app uses your device's built-in speech recognition to show you text as you speak. It’s a simple, reliable way to confirm audio is being captured correctly without waiting for a server.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">2. AI-Powered Accuracy (Processing Layer)</h4>
                    <p className="text-muted-foreground text-sm">
                      Once your meeting is saved, we process the full audio recording with Google Gemini 2.5. This provides a highly accurate transcript, identifies who said what, and allows for translation into 130+ languages.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-16 md:py-24 bg-primary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Reclaim Your Meetings?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Experience the freedom of fully engaged conversations. Let Dicta-Notes handle the notes.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button size="lg" className="px-8 py-6 text-lg" onClick={() => navigate("/transcribe")}>
                Start Transcribing for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg" onClick={() => navigate("/contact")}>
                Contact Sales
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
