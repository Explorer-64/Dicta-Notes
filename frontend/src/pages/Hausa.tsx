import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MonitorSpeaker, Users, Languages, Download, Globe } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

export default function Hausa() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Hausa Landing Page', { language: 'ha' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'ha');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="ha" />
        <title>Dicta-Notes | Rubuta Tarurrukan Aiki da AI a Lokacin da Ake Yi</title>
        <meta name="description" content="Dicta-Notes yana amfani da AI na zamani don rubuta tarurrukan aiki a lokacin da ake yi tare da gane masu magana. Yana goyan bayan harsuna sama da 130, rubuta tare da Google Gemini 2.5, kuma fitar da su ta hanyoyi daban-daban." />
        <link rel="canonical" href="https://dicta-notes.com/hausa" />
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
        <meta property="og:title" content="Dicta-Notes | Rubuta Tarurruka da AI" />
        <meta property="og:description" content="Rubuta tarurrukan aiki a lokacin da ake yi tare da gane masu magana. Harsuna sama da 130 ana goyan bayan su." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/hausa" />
        <meta property="og:locale" content="ha_NG" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://dicta-notes.com/hausa#app",
            "url": "https://dicta-notes.com/hausa",
            "name": "Dicta-Notes",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "ha",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Rubuta tarurrukan aiki a lokacin da ake yi tare da gane masu magana ta hanyar AI. Yana goyan bayan harsuna sama da 130 tare da fassara ta atomatik."
          })}
        </script>
      </Helmet>

      <Header />

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Rubuta Tarurrukan Aiki da AI
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Dicta-Notes yana rubuta tarurrukan aiki naku a lokacin da ake yi ta amfani da fasahar AI ta zamani ta Google Gemini 2.5. Yana gane har masu magana 10+ daban-daban kai tsaye kuma yana fassara zuwa harsuna sama da 130.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12 text-left">
            <div className="flex gap-3">
              <MonitorSpeaker className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Rubuta a Lokacin da Ake Yi</h3>
                <p className="text-sm text-muted-foreground">Yana canza tattaunawa zuwa rubutu mai inganci yayin da yake faruwa.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Gane Masu Magana</h3>
                <p className="text-sm text-muted-foreground">Yana bambanta kai tsaye tsakanin mahalarta 10+.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Languages className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Harsuna 130+</h3>
                <p className="text-sm text-muted-foreground">Fassara rubuce-rubucen zuwa kowace babbar harshe.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Download className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Fitarwa mai Sassauci</h3>
                <p className="text-sm text-muted-foreground">Zazzage a cikin TXT, Markdown ko raba kai tsaye.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Yana Aiki ba tare da Intanet ba</h3>
                <p className="text-sm text-muted-foreground">Manhaja ta yanar gizo mai ci gaba (PWA) mai ikon aiki ba tare da intanet ba.</p>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={handleStartTranscribing} className="px-8">
            Fara Rubuta Kyauta
          </Button>
        </div>
      </section>
    </div>
  );
}
