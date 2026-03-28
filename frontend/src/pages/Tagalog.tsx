import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MonitorSpeaker, Users, Languages, Download, Globe } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

export default function Tagalog() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Tagalog Landing Page', { language: 'tl' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'tl');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="tl" />
        <title>Dicta-Notes | AI Voice Notes para sa Tagalog na Meetings</title>
        <meta name="description" content="Dicta-Notes ay nag-aalok ng real-time transcription at speaker identification gamit ang advanced AI para sa iyong Tagalog meetings. May suporta sa awtomatikong pagsasalin sa 130+ wika." />
        <link rel="canonical" href="https://dicta-notes.com/tagalog" />
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
        <meta property="og:title" content="Dicta-Notes | AI Notes sa Tagalog" />
        <meta property="og:description" content="Real-time meeting transcription na may speaker identification. Suportado ang 130+ wika." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/tagalog" />
        <meta property="og:locale" content="tl_PH" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "tl",
            "url": "https://dicta-notes.com/tagalog",
            "@id": "https://dicta-notes.com/tagalog",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Real-time meeting transcription na may AI speaker identification. Suportado ang 130+ wika na may awtomatikong pagsasalin."
          })}
        </script>
      </Helmet>

      <Header />

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            AI Meeting Transcription
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Ang Dicta-Notes ay nag-transcribe ng iyong meetings sa real-time gamit ang advanced Google Gemini 2.5. Awtomatikong nakikilala ang hanggang 10+ magkaibang nagsasalita at nagsasalin sa 130+ wika.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12 text-left">
            <div className="flex gap-3">
              <MonitorSpeaker className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Real-Time Transcription</h3>
                <p className="text-sm text-muted-foreground">Ginagawang tumpak na text ang mga pag-uusap habang nangyayari.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Speaker Identification</h3>
                <p className="text-sm text-muted-foreground">Awtomatikong pinag-iiba ang 10+ kalahok.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Languages className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">130+ Wika</h3>
                <p className="text-sm text-muted-foreground">Isalin ang mga transcript sa anumang pangunahing wika.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Download className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Flexible Export</h3>
                <p className="text-sm text-muted-foreground">I-download bilang TXT, Markdown o direktang ibahagi.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Gumagana Offline</h3>
                <p className="text-sm text-muted-foreground">Progressive Web App (PWA) na may offline capability.</p>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={handleStartTranscribing} className="px-8">
            Magsimula ng Libreng Transkripsyon
          </Button>

          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-3">Tingnan ang Dicta-Notes sa ibang wika:</p>
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
