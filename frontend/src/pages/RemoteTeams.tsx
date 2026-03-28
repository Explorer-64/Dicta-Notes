import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Archive, Search, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "components/Header";
import { BackButton } from "components/BackButton";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

const featureHighlights = [
  {
    icon: <Clock className="h-8 w-8 text-blue-500" />,
    title: "Embrace Asynchronous Work",
    description: "Replace status update meetings with searchable, summarized transcripts. Keep everyone in the loop, regardless of their time zone.",
  },
  {
    icon: <Search className="h-8 w-8 text-green-500" />,
    title: "A Searchable Team Memory",
    description: "Every conversation becomes a part of your team's collective knowledge base. Instantly find key decisions, deadlines, and action items.",
  },
  {
    icon: <Archive className="h-8 w-8 text-yellow-500" />,
    title: "Automated Meeting Notes",
    description: "Get detailed, speaker-identified notes powered by Google Gemini 2.5. Focus on the conversation, not on taking notes.",
  },
];

const faqItems = [
  {
    question: "How does this help reduce meeting fatigue?",
    answer: "By providing reliable and detailed transcripts, you can confidently skip status update meetings. Team members can catch up on their own time, leading to fewer, more focused live sessions."
  },
  {
    question: "Can we integrate this with our project management tools?",
    answer: "While we don't have direct integrations yet, you can easily export transcripts in various formats (Text, Markdown, Word) to copy-paste action items and summaries into tools like Asana, Jira, or Trello."
  },
  {
    question: "What's the difference between browser speech and the final transcript?",
    answer: "The live text you see during recording is for immediate UX feedback. The final, highly-accurate transcript is processed by Google Gemini 2.5 from the saved audio for maximum quality and reliability."
  },
  {
    question: "Is this suitable for confidential internal discussions?",
    answer: "Yes. We use Firebase's secure infrastructure to ensure your data is encrypted and protected. It's a secure solution for most business communication, but we are not HIPAA compliant."
  }
];

export default function RemoteTeamsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Remote Teams Page', { language: 'en', niche: 'remote-teams' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'en');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <BackButton />
      <Helmet>
        <html lang="en" />
        <title>Dicta-Notes for Remote Teams | AI Transcription for Distributed Teams</title>
        <meta name="description" content="AI-powered meeting transcription for remote and distributed teams. Reduce meeting fatigue, enable async collaboration, and build a searchable knowledge base across time zones." />
        <meta name="keywords" content="remote team transcription, distributed team meetings, async meeting notes, time zone collaboration, remote work documentation, distributed team productivity" />
        <link rel="canonical" href="https://dicta-notes.com/remote-teams" />
        
        {/* Hreflang tags for remote teams pages */}
        <link rel="alternate" hrefLang="en" href="https://dicta-notes.com/remote-teams" />
        <link rel="alternate" hrefLang="fr" href="https://dicta-notes.com/remote-teams-fr" />
        <link rel="alternate" hrefLang="es" href="https://dicta-notes.com/remote-teams-es" />
        <link rel="alternate" hrefLang="de" href="https://dicta-notes.com/remote-teams-de" />
        <link rel="alternate" hrefLang="el" href="https://dicta-notes.com/remote-teams-el" />
        <link rel="alternate" hrefLang="ko" href="https://dicta-notes.com/remote-teams-ko" />
        <link rel="alternate" hrefLang="x-default" href="https://dicta-notes.com/remote-teams" />

        {/* Open Graph */}
        <meta property="og:title" content="Dicta-Notes for Remote Teams" />
        <meta property="og:description" content="AI meeting transcription for distributed teams. Enable async collaboration across time zones with automated meeting notes." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/remote-teams" />
        <meta property="og:locale" content="en_US" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes for Remote Teams",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "en",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "AI-powered meeting transcription for remote and distributed teams. Reduce meeting fatigue, enable async collaboration, and build searchable documentation across time zones with speaker identification in 130+ languages.",
            "audience": {
              "@type": "BusinessAudience",
              "name": "Remote and Distributed Teams"
            }
          })}
        </script>
      </Helmet>

      <div className="bg-background text-foreground">
        {/* Hero Section */}
        <section className="text-center py-20 px-4 bg-gray-50 dark:bg-gray-900">
          <h1 className="text-4xl md:text-5xl font-bold">
            More Doing, Less Time in Meetings
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Dicta-Notes gives your remote team the power of asynchronous communication with AI-transcribed meetings. Turn every conversation into actionable, searchable documentation.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={handleStartTranscribing}>
              Start Your Free Trial
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
                  When you click "Start Your Free Trial" and access the app, the interface may be in English. You can easily translate it to your language (or any of 130+ languages) by clicking the translate button (globe icon 🌐) in the header at the top of the page.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-16 px-4">
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold">Is Your Distributed Team Drowning in Meetings?</h2>
                <p className="text-muted-foreground mt-4">
                    Coordinating across time zones often leads to meeting overload, information silos, and endless status updates that kill productivity.
                </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Meeting Fatigue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Back-to-back video calls leave no time for deep work. Important conversations are rushed and team members are disengaged.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Information Silos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Key decisions made in meetings are lost as soon as the call ends, unavailable to those who couldn't attend.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Time Zone Conflicts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Team members are forced into early morning or late-night calls, leading to burnout and inequitable participation.</p>
                    </CardContent>
                </Card>
            </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Work Smarter, Not Harder</h2>
            <p className="text-muted-foreground mt-2">
              Dicta-Notes is built for the modern, asynchronous-first remote team.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-6xl mx-auto">
            {featureHighlights.map((feature, index) => (
              <div key={index} className="flex flex-col items-center text-center p-4">
                {feature.icon}
                <h3 className="text-xl font-semibold mt-4">{feature.title}</h3>
                <p className="text-muted-foreground mt-2">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-16 px-4">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-8">Your Questions, Answered</h2>
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
        <section className="py-20 px-4 text-center bg-green-600 text-white">
          <h2 className="text-3xl font-bold">Ready to Reclaim Your Team's Time?</h2>
          <p className="mt-4 max-w-2xl mx-auto">
            Empower your distributed team with the tools to communicate effectively, no matter where or when they work.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={() => navigate("/login")}>
              Start Free Trial Now
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-green-600" onClick={() => navigate("/pricing")}>
              See Pricing
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
