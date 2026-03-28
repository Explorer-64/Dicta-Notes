import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MonitorSpeaker, Users, Languages, Download, Globe } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

export default function Polish() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Polish Landing Page', { language: 'pl' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'pl');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="pl" />
        <title>Dicta-Notes | Notatki Głosowe AI do Spotkań w Języku Polskim</title>
        <meta name="description" content="Dicta-Notes zapewnia transkrypcję w czasie rzeczywistym i identyfikację mówców przy użyciu zaawansowanej sztucznej inteligencji dla Twoich polskich spotkań. Obsługa automatycznego tłumaczenia na 130+ języków." />
        <link rel="canonical" href="https://dicta-notes.com/polish" />
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
        <meta property="og:title" content="Dicta-Notes | Notatki AI po Polsku" />
        <meta property="og:description" content="Transkrypcja spotkań w czasie rzeczywistym z identyfikacją mówców. Obsługa 130+ języków." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/polish" />
        <meta property="og:locale" content="pl_PL" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "pl",
            "url": "https://dicta-notes.com/polish",
            "@id": "https://dicta-notes.com/polish",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Transkrypcja spotkań w czasie rzeczywistym z identyfikacją mówców AI. Obsługa 130+ języków z automatycznym tłumaczeniem."
          })}
        </script>
      </Helmet>

      <Header />

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Transkrypcja Spotkań z AI
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Dicta-Notes transkrybuje Twoje spotkania w czasie rzeczywistym przy użyciu zaawansowanej sztucznej inteligencji Google Gemini 2.5. Automatycznie rozpoznaje do 10+ różnych mówców i tłumaczy na 130+ języków.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12 text-left">
            <div className="flex gap-3">
              <MonitorSpeaker className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Transkrypcja w Czasie Rzeczywistym</h3>
                <p className="text-sm text-muted-foreground">Przekształca rozmowy w dokładny tekst w miarę ich prowadzenia.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Identyfikacja Mówców</h3>
                <p className="text-sm text-muted-foreground">Automatycznie rozróżnia między 10+ uczestnikami.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Languages className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">130+ Języków</h3>
                <p className="text-sm text-muted-foreground">Tłumacz transkrypcje na dowolny język główny.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Download className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Elastyczny Eksport</h3>
                <p className="text-sm text-muted-foreground">Pobierz jako TXT, Markdown lub udostępnij bezpośrednio.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Działa Offline</h3>
                <p className="text-sm text-muted-foreground">Progresywna Aplikacja Internetowa (PWA) z możliwością pracy offline.</p>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={handleStartTranscribing} className="px-8">
            Rozpocznij darmową transkrypcję
          </Button>
        </div>
      </section>
    </div>
  );
}
