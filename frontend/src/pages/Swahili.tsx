import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MonitorSpeaker, Users, Languages, Download, Globe } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

export default function Swahili() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Swahili Landing Page', { language: 'sw' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'sw');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="sw" />
        <title>Dicta-Notes | Uandishi wa Mikutano kwa Wakati Halisi na AI</title>
        <meta name="description" content="Dicta-Notes inatumia AI ya hali ya juu kuandika mikutano kwa wakati halisi na utambuzi wa wazungumzaji. Inasaidia lugha zaidi ya 130, uandishi na Gemini 2.5 Pro, na usafirishaji katika muundo mbalimbali." />
        <link rel="canonical" href="https://dicta-notes.com/swahili" />
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
        <meta property="og:title" content="Dicta-Notes | Uandishi wa Mikutano na AI" />
        <meta property="og:description" content="Uandishi wa mikutano kwa wakati halisi na utambuzi wa wazungumzaji. Lugha zaidi ya 130 zinasaidiwa." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/swahili" />
        <meta property="og:locale" content="sw_KE" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "sw",
            "url": "https://dicta-notes.com/swahili",
            "@id": "https://dicta-notes.com/swahili",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Uandishi wa mikutano kwa wakati halisi na utambuzi wa wazungumzaji unaotumia AI. Inasaidia lugha zaidi ya 130 na tafsiri ya kiotomatiki."
          })}
        </script>
      </Helmet>

      <Header />

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Uandishi wa Mikutano kwa AI
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Dicta-Notes inaandika mikutano yako kwa wakati halisi kwa kutumia akili bandia ya hali ya juu ya Google Gemini 2.5 Pro. Inatambua kiotomatiki hadi wazungumzaji 10+ tofauti na kutafsiri katika lugha zaidi ya 130.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12 text-left">
            <div className="flex gap-3">
              <MonitorSpeaker className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Uandishi wa Wakati Halisi</h3>
                <p className="text-sm text-muted-foreground">Hubadilisha mazungumzo kuwa maandishi sahihi yanapotokea.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Utambuzi wa Wazungumzaji</h3>
                <p className="text-sm text-muted-foreground">Hutofautisha kiotomatiki kati ya washiriki 10+.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Languages className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Lugha 130+</h3>
                <p className="text-sm text-muted-foreground">Tafsiri maandishi kuwa lugha yoyote kuu.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Download className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Usafirishaji wa Kubadilika</h3>
                <p className="text-sm text-muted-foreground">Pakua katika TXT, Markdown au shiriki moja kwa moja.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Inafanya Kazi Nje ya Mtandao</h3>
                <p className="text-sm text-muted-foreground">Programu ya wavuti inayoendelea (PWA) yenye uwezo wa kufanya kazi nje ya mtandao.</p>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={handleStartTranscribing} className="px-8">
            Anza Kunakili Bure
          </Button>

          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-3">Tazama Dicta-Notes katika lugha nyingine:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>English</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/french')}>Français</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/spanish')}>Español</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/portuguese')}>Português</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/arabic')}>العربية</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/afrikaans')}>Afrikaans</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/hausa')}>Hausa</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/zulu')}>isiZulu</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
