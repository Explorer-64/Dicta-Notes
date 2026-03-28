import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MonitorSpeaker, Users, Languages, Download, Globe } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

export default function Bengali() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Bengali Landing Page', { language: 'bn' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'bn');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="bn" />
        <title>Dicta-Notes | বাংলা মিটিং এর জন্য AI ভয়েস নোটস</title>
        <meta name="description" content="Dicta-Notes আপনার বাংলা মিটিং এর জন্য উন্নত AI দিয়ে রিয়েল-টাইম ট্রান্সক্রিপশন এবং স্পিকার সনাক্তকরণ প্রদান করে। ১৩০+ ভাষায় স্বয়ংক্রিয় অনুবাদ সমর্থন।" />
        <link rel="canonical" href="https://dicta-notes.com/bengali" />
        <meta name="robots" content="index, follow" />
        
        {/* Hreflang tags */}
        <link rel="alternate" hrefLang="x-default" href="https://dicta-notes.com" />
        <link rel="alternate" hrefLang="en" href="https://dicta-notes.com" />
        <link rel="alternate" hrefLang="es" href="https://dicta-notes.com/spanish" />
        <link rel="alternate" hrefLang="fr" href="https://dicta-notes.com/french" />
        <link rel="alternate" hrefLang="de" href="https://dicta-notes.com/german" />
        <link rel="alternate" hrefLang="pt" href="https://dicta-notes.com/portuguese" />
        <link rel="alternate" hrefLang="zh" href="https://dicta-notes.com/chinese" />
        <link rel="alternate" hrefLang="ja" href="https://dicta-notes.com/japanese" />
        <link rel="alternate" hrefLang="ar" href="https://dicta-notes.com/arabic" />
        <link rel="alternate" hrefLang="hi" href="https://dicta-notes.com/hindi" />
        <link rel="alternate" hrefLang="ru" href="https://dicta-notes.com/russian" />
        <link rel="alternate" hrefLang="ko" href="https://dicta-notes.com/korean" />
        <link rel="alternate" hrefLang="vi" href="https://dicta-notes.com/vietnamese" />
        <link rel="alternate" hrefLang="bn" href="https://dicta-notes.com/bengali" />
        <link rel="alternate" hrefLang="tr" href="https://dicta-notes.com/turkish" />
        <link rel="alternate" hrefLang="th" href="https://dicta-notes.com/thai" />
        <link rel="alternate" hrefLang="tl" href="https://dicta-notes.com/tagalog" />
        <link rel="alternate" hrefLang="ta" href="https://dicta-notes.com/tamil" />
        <link rel="alternate" hrefLang="te" href="https://dicta-notes.com/telugu" />
        <link rel="alternate" hrefLang="pa" href="https://dicta-notes.com/punjabi" />
        <link rel="alternate" hrefLang="pl" href="https://dicta-notes.com/polish" />
        <link rel="alternate" hrefLang="id" href="https://dicta-notes.com/indonesian" />
        <link rel="alternate" hrefLang="ms" href="https://dicta-notes.com/malay" />
        <link rel="alternate" hrefLang="sw" href="https://dicta-notes.com/swahili" />
        <link rel="alternate" hrefLang="ha" href="https://dicta-notes.com/hausa" />
        <link rel="alternate" hrefLang="yo" href="https://dicta-notes.com/yoruba" />
        <link rel="alternate" hrefLang="zu" href="https://dicta-notes.com/zulu" />
        <link rel="alternate" hrefLang="af" href="https://dicta-notes.com/afrikaans" />

        {/* Open Graph */}
        <meta property="og:title" content="Dicta-Notes | বাংলায় AI নোটস" />
        <meta property="og:description" content="স্পিকার সনাক্তকরণ সহ রিয়েল-টাইম মিটিং ট্রান্সক্রিপশন। ১৩০+ ভাষা সমর্থন।" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/bengali" />
        <meta property="og:locale" content="bn_BD" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://dicta-notes.com/bengali#app",
            "url": "https://dicta-notes.com/bengali",
            "name": "Dicta-Notes",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "bn",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "AI দিয়ে স্পিকার সনাক্তকরণ সহ রিয়েল-টাইম মিটিং ট্রান্সক্রিপশন। স্বয়ংক্রিয় অনুবাদ সহ ১৩০+ ভাষা সমর্থন।"
          })}
        </script>
      </Helmet>

      <Header />

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            AI দিয়ে মিটিং ট্রান্সক্রিপশন
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Dicta-Notes আপনার মিটিং গুলি উন্নত Google Gemini 2.5 ব্যবহার করে রিয়েল-টাইমে ট্রান্সক্রাইব করে। স্বয়ংক্রিয়ভাবে ১০+ বিভিন্ন স্পিকার সনাক্ত করে এবং ১৩০+ ভাষায় অনুবাদ করে।
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12 text-left">
            <div className="flex gap-3">
              <MonitorSpeaker className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">রিয়েল-টাইম ট্রান্সক্রিপশন</h3>
                <p className="text-sm text-muted-foreground">কথোপকথনকে সঠিক টেক্সটে রূপান্তরিত করে যখন সেগুলি ঘটছে।</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">স্পিকার সনাক্তকরণ</h3>
                <p className="text-sm text-muted-foreground">স্বয়ংক্রিয়ভাবে ১০+ অংশগ্রহণকারীদের মধ্যে পার্থক্য করে।</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Languages className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">১৩০+ ভাষা</h3>
                <p className="text-sm text-muted-foreground">যেকোনো প্রধান ভাষায় ট্রান্সক্রিপ্ট অনুবাদ করুন।</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Download className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">নমনীয় এক্সপোর্ট</h3>
                <p className="text-sm text-muted-foreground">TXT, Markdown হিসাবে ডাউনলোড করুন বা সরাসরি শেয়ার করুন।</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">অফলাইনে কাজ করে</h3>
                <p className="text-sm text-muted-foreground">অফলাইন ক্ষমতা সহ প্রগতিশীল ওয়েব অ্যাপ (PWA)।</p>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={handleStartTranscribing} className="px-8">
            বিনামূল্যে ট্রান্সক্রিপশন শুরু করুন
          </Button>

          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-3">অন্যান্য ভাষায় Dicta-Notes দেখুন:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>English</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/spanish')}>Español</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/french')}>Français</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/german')}>Deutsch</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/portuguese')}>Português</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/chinese')}>中文</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/japanese')}>日本語</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/hindi')}>हिन्दी</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/russian')}>Русский</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/korean')}>한국어</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
