import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Zap, Globe, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "components/Header";
import { BackButton } from "components/BackButton";
import { SEOMetaTags } from "components/SEOMetaTags";
import { SchemaMarkup } from "components/SchemaMarkup";

const featureHighlights = [
  {
    icon: <Globe className="h-8 w-8 text-blue-500" />,
    title: "130+ Supported Languages",
    description: "Translate your meeting transcripts to over 130 languages with industry-leading accuracy. Break down language barriers instantly.",
  },
  {
    icon: <Users className="h-8 w-8 text-green-500" />,
    title: "Accurate Speaker Identification",
    description: "Our AI accurately identifies and labels up to 10+ speakers, so you always know who said what, regardless of their language.",
  },
  {
    icon: <Zap className="h-8 w-8 text-yellow-500" />,
    title: "On-Demand AI Processing",
    description: "Record now, and let Gemini 2.5 Pro transcribe, identify speakers, and translate your audio whenever you're ready.",
  },
];

const faqItems = [
    {
      question: "How accurate is the translation?",
      answer: "We use Google's advanced translation models, which are the gold standard for accuracy across a vast number of languages. While not perfect, it's highly effective for understanding context and key discussion points."
    },
    {
      question: "Can it handle multiple languages in the same meeting?",
      answer: "Yes. Our system detects the primary languages spoken and can process multilingual conversations. The final transcript can then be translated into your language of choice."
    },
    {
      question: "Is there a limit to the number of translations I can perform?",
      answer: "Our plans are designed to be generous. Please refer to our Pricing page for specific details on translation quotas for each tier."
    },
    {
      question: "How secure is our meeting data?",
      answer: "We take data security very seriously. All data is encrypted in transit and at rest, and we leverage Firebase's secure infrastructure to protect your information. We are not HIPAA compliant."
    }
  ];

export default function MultilingualMeetingsPage() {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <SEOMetaTags
        title="AI Transcription & Translation for Multilingual Meetings"
        description="Dicta-Notes provides real-time AI transcription and translation for global teams. Supports 130+ languages and identifies 10+ speakers to enhance international collaboration."
        keywords="multilingual meeting transcription, translate meeting notes, international team collaboration, global meeting solution, AI language translation"
      />
      <SchemaMarkup
        type="Article"
        data={{
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Break Down Language Barriers: AI Transcription for Multilingual Meetings",
            "author": {
              "@type": "Organization",
              "name": "Dicta-Notes"
            },
            "publisher": {
                "@type": "Organization",
                "name": "Dicta-Notes",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://dicta-notes.com/logo.png"
                }
            },
            "datePublished": "2025-10-14",
            "description": "Learn how AI-powered transcription and translation can solve the biggest challenges faced by global teams in multilingual meetings.",
        }}
      />
      <div className="bg-background text-foreground">
        {/* Hero Section */}
        <section className="text-center py-20 px-4 bg-gray-50 dark:bg-gray-900">
          <h1 className="text-4xl md:text-5xl font-bold">
            Never Let Language Be a Barrier Again
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Dicta-Notes delivers industry-leading transcription and translation for your global meetings. Empower your international team to collaborate seamlessly in over 130 languages.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={() => navigate("/login")}>
              Start Your Free Trial
            </Button>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-16 px-4">
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold">Are Your Global Meetings Lost in Translation?</h2>
                <p className="text-muted-foreground mt-4">
                    Running an international team is hard. Miscommunication, lost details, and language barriers can slow down your most critical projects.
                </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Inaccurate Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Manually taking notes in multiple languages leads to errors and critical details being missed. Non-native speakers often hesitate to speak up.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Slow Post-Meeting Process</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Waiting days for expensive human translators to return meeting minutes creates bottlenecks and delays important decisions.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Exclusion of Team Members</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Team members who aren't fluent in the meeting's primary language can feel disconnected and unable to contribute their best ideas.</p>
                    </CardContent>
                </Card>
            </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Your All-in-One Solution for Global Communication</h2>
            <p className="text-muted-foreground mt-2">
              Dicta-Notes is designed for the unique challenges of international teams.
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
                <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
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
        <section className="py-20 px-4 text-center bg-blue-600 text-white">
          <h2 className="text-3xl font-bold">Ready to Transform Your Global Meetings?</h2>
          <p className="mt-4 max-w-2xl mx-auto">
            Stop letting language barriers limit your team's potential. Get started with AI-powered transcription and translation today.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={() => navigate("/login")}>
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-blue-600" onClick={() => navigate("/pricing")}>
              View Pricing
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
