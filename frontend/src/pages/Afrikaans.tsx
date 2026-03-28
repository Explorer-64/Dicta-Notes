import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MonitorSpeaker, Users, Languages, Download, Globe } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

export default function Afrikaans() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Afrikaans Landing Page', { language: 'af' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'af');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="af" />
        <title>Dicta-Notes | Regtydse KI-gedrewe Vergadertranskripsie</title>
        <meta name="description" content="Dicta-Notes gebruik gevorderde KI om vergaderings in regte tyd te transkribeer met spreker-identifikasie. Ondersteun meer as 130 tale, transkribeer met Google Gemini 2.5, en voer uit in verskeie formate." />
        <link rel="canonical" href="https://dicta-notes.com/afrikaans" />
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
        <meta property="og:title" content="Dicta-Notes | KI Vergadertranskripsie" />
        <meta property="og:description" content="Regtydse vergadertranskripsie met spreker-identifikasie. Meer as 130 tale ondersteun." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/afrikaans" />
        <meta property="og:locale" content="af_ZA" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://dicta-notes.com/afrikaans#app",
            "url": "https://dicta-notes.com/afrikaans",
            "name": "Dicta-Notes",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "af",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Regtydse vergadertranskripsie met KI-gedrewe spreker-identifikasie. Ondersteun meer as 130 tale met outomatiese vertaling."
          })}
        </script>
      </Helmet>

      <Header />

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            KI-gedrewe Vergadertranskripsie
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Dicta-Notes transkribeer jou vergaderings in regte tyd met behulp van Google Gemini 2.5 se gevorderde kunsmatige intelligensie. Identifiseer outomaties tot 10+ verskillende sprekers en vertaal in meer as 130 tale.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12 text-left">
            <div className="flex gap-3">
              <MonitorSpeaker className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Regtydse Transkripsie</h3>
                <p className="text-sm text-muted-foreground">Skakel gesprekke om na akkurate teks soos dit gebeur.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Spreker-identifikasie</h3>
                <p className="text-sm text-muted-foreground">Onderskei outomaties tussen 10+ deelnemers.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Languages className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">130+ Tale</h3>
                <p className="text-sm text-muted-foreground">Vertaal transkripsies na enige hooftaal.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Download className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Buigsame Uitvoer</h3>
                <p className="text-sm text-muted-foreground">Laai af in TXT, Markdown of deel direk.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Werk Vanlyn</h3>
                <p className="text-sm text-muted-foreground">Progressiewe web-app (PWA) met vanlyn-vermoëns.</p>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={handleStartTranscribing} className="px-8">
            Begin Gratis Transkripsie
          </Button>
        </div>
      </section>
    </div>
  );
}
