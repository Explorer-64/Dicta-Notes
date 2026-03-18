import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SchemaMarkup } from "components/SchemaMarkup";

export default function FAQs() {
  const navigate = useNavigate();

  const handleBack = () => {
    try {
      const stateIdx = (window.history as any)?.state?.idx ?? 0;
      const hasReferrer = !!document.referrer;
      const sameOriginReferrer = hasReferrer && new URL(document.referrer).origin === window.location.origin;
      const canGoBack = stateIdx > 0 || sameOriginReferrer || (window.history?.length ?? 0) > 1;
      if (canGoBack) {
        navigate(-1);
      } else {
        navigate("/");
      }
    } catch (_e) {
      // Fallback if any error parsing referrer/origin
      navigate("/");
    }
  };

  // FAQ data for schema markup
  const faqItems = [
    {
      question: "How does Dicta-Notes identify different speakers?",
      answer: "Dicta-Notes uses Gemini 2.5 Pro to analyze your recorded session and automatically differentiate and label 10+ speakers. After transcription, you can quickly rename speaker labels for perfect accuracy across the entire transcript."
    },
    {
      question: "Can I use Dicta-Notes for meetings in multiple languages?",
      answer: "Yes. Transcription works natively in 130+ languages and detects the spoken language automatically. After transcription, you can optionally translate the text to another language for sharing or collaboration."
    },
    {
      question: "How do I share a transcription with others?",
      answer: "Export your transcript from the session details page as PDF, Microsoft Word (.docx), plain text (.txt), or Markdown (.md), then share the file. Live share links are not available in the current version."
    },
    {
      question: "What happens if I lose my internet connection while recording?",
      answer: "Dicta-Notes supports offline recording. If your connection drops, recording continues locally; once reconnected, your session syncs to your account so you don't lose any content."
    },
    {
      question: "How secure are my meeting transcriptions?",
      answer: "Your data is encrypted in transit and at rest. Authentication and storage are powered by Firebase for enterprise-grade security. You control when to save sessions and what to export."
    },
    {
      question: "Can I edit speaker names after a transcription?",
      answer: "Yes. Edit speaker names directly in the session details view; changes apply to all segments for that speaker throughout the transcript."
    },
    {
      question: "What's the best way to record for high accuracy?",
      answer: "For online meetings (Zoom/Teams/Meet), choose System/Tab Audio and ensure 'Share audio' is enabled. For in-person meetings, use a microphone near the speakers and reduce background noise."
    },
    {
      question: "What is a Progressive Web App (PWA) and why should I install it?",
      answer: "Installing the Dicta-Notes PWA gives you an app-like experience on desktop or mobile, faster loading, and enhanced offline support. See the Install page for instructions."
    },
    {
      question: "How do I delete my account?",
      answer: "You can delete your account permanently from the Settings page. Go to Settings > Account > Delete Account. This action is irreversible and will remove all your data, including transcripts and subscription details."
    },
    {
      question: "How does the app translate into my language?",
      answer: "Dicta-Notes automatically detects your browser's language preference and uses Google Gemini 2.0 Flash to translate the entire interface in real-time. The moment you open the app, everything appears in your native language—buttons, labels, instructions, and more—across 130+ supported languages. You can also manually switch languages anytime using the translate button in the header. No configuration needed."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Frequently Asked Questions - Dicta-Notes</title>
        <meta name="description" content="Find answers to common questions about using Dicta-Notes for meeting transcription, speaker identification, and translation." />
        <meta property="og:title" content="Frequently Asked Questions - Dicta-Notes" />
        <meta property="og:description" content="Answers about AI transcription, 10+ speakers, 130+ languages, exports, PWA and security." />
        <meta name="twitter:card" content="summary" />
        <link rel="canonical" href="https://dicta-notes.com/fa-qs" />
      </Helmet>
      
      {/* FAQ Page Schema for Rich Results */}
      <SchemaMarkup type="FAQPage" faqItems={faqItems} />
      
      <div className="flex flex-col min-h-screen bg-gray-50/50">
        <Header />
        <div className="container mx-auto px-4 py-8 sm:py-10 mt-4 max-w-4xl">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 text-primary hover:text-primary/90"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-800">Frequently Asked Questions</h1>
          <p className="text-gray-600 mb-8">Quick answers to common questions about using Dicta-Notes.</p>
          
          <Card className="overflow-hidden">
            <CardHeader className="bg-gray-100/80 border-b">
              <CardTitle>Core Features & Usage</CardTitle>
              <CardDescription>
                Understanding the essentials of Dicta-Notes.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-lg font-medium">How does Dicta-Notes identify different speakers?</AccordionTrigger>
                  <AccordionContent className="text-base text-gray-700 leading-relaxed">
                    Dicta-Notes uses Gemini 2.5 Pro to analyze your recorded session and automatically differentiate and label 10+ speakers. After transcription, you can quickly rename speaker labels for perfect accuracy across the entire transcript.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-lg font-medium">Can I use Dicta-Notes for meetings in multiple languages?</AccordionTrigger>
                  <AccordionContent className="text-base text-gray-700 leading-relaxed">
                    Yes. Transcription works natively in 130+ languages and detects the spoken language automatically. After transcription, you can optionally translate the text to another language for sharing or collaboration.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-lg font-medium">How do I share a transcription with others?</AccordionTrigger>
                  <AccordionContent className="text-base text-gray-700 leading-relaxed">
                    Export your transcript from the session details page as PDF, Microsoft Word (.docx), plain text (.txt), or Markdown (.md), then share the file. Live share links are not available in the current version.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-lg font-medium">What happens if I lose my internet connection while recording?</AccordionTrigger>
                  <AccordionContent className="text-base text-gray-700 leading-relaxed">
                    Dicta-Notes supports offline recording. If your connection drops, recording continues locally; once reconnected, your session syncs to your account so you don’t lose any content.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-lg font-medium">How secure are my meeting transcriptions?</AccordionTrigger>
                  <AccordionContent className="text-base text-gray-700 leading-relaxed">
                    Your data is encrypted in transit and at rest. Authentication and storage are powered by Firebase for enterprise-grade security. You control when to save sessions and what to export.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-lg font-medium">Can I edit speaker names after a transcription?</AccordionTrigger>
                  <AccordionContent className="text-base text-gray-700 leading-relaxed">
                    Yes. Edit speaker names directly in the session details view; changes apply to all segments for that speaker throughout the transcript.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger className="text-lg font-medium">What’s the best way to record for high accuracy?</AccordionTrigger>
                  <AccordionContent className="text-base text-gray-700 leading-relaxed">
                    For online meetings (Zoom/Teams/Meet), choose System/Tab Audio and ensure "Share audio" is enabled. For in-person meetings, use a microphone near the speakers and reduce background noise.
                  </AccordionContent>
                </AccordionItem>

                 <AccordionItem value="item-8">
                  <AccordionTrigger className="text-lg font-medium">What is a Progressive Web App (PWA) and why should I install it?</AccordionTrigger>
                  <AccordionContent className="text-base text-gray-700 leading-relaxed">
                    Installing the Dicta-Notes PWA gives you an app-like experience on desktop or mobile, faster loading, and enhanced offline support. See the <span onClick={() => navigate('/install')} className="text-primary hover:underline cursor-pointer">Install page</span> for instructions.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-9">
                  <AccordionTrigger className="text-lg font-medium">How do I delete my account?</AccordionTrigger>
                  <AccordionContent className="text-base text-gray-700 leading-relaxed">
                    You can delete your account permanently from the Settings page. Go to <strong>Settings &gt; Account &gt; Delete Account</strong>. This action is irreversible and will remove all your data, including transcripts and subscription details.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-10">
                  <AccordionTrigger className="text-lg font-medium">How does the app translate into my language?</AccordionTrigger>
                  <AccordionContent className="text-base text-gray-700 leading-relaxed">
                    Dicta-Notes automatically detects your browser's language preference and uses Google Gemini 2.0 Flash to translate the entire interface in real-time. The moment you open the app, everything appears in your native language—buttons, labels, instructions, and more—across 130+ supported languages. You can also manually switch languages anytime using the translate button in the header. No configuration needed.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
