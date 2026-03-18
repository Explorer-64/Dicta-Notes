import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MonitorSpeaker, Users, Languages, Download, Globe } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

export default function Zulu() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Zulu Landing Page', { language: 'zu' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'zu');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="zu" />
        <title>Dicta-Notes | Ukubhala Imihlangano Ngesikhathi Esigcwele nge-AI</title>
        <meta name="description" content="I-Dicta-Notes isebenzisa i-AI ephezulu ukubhala imihlangano ngesikhathi esigcwele nokuhlonza abasebenzi. Isekela izilimi ezingaphezu kuka-130, ibhala nge-Gemini 2.5 Pro, futhi ikhiphe ngezindlela ezahlukene." />
        <link rel="canonical" href="https://dicta-notes.com/zu" />
        
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
        <meta property="og:title" content="Dicta-Notes | Ukubhala Imihlangano nge-AI" />
        <meta property="og:description" content="Ukubhala imihlangano ngesikhathi esigcwele nokuhlonza abasebenzi. Izilimi ezingaphezu kuka-130 ziyasekelwa." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/zulu" />
        <meta property="og:locale" content="zu_ZA" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "zu",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Ukubhala imihlangano ngesikhathi esigcwele nokuhlonza abasebenzi ngokusebenzisa i-AI. Isekela izilimi ezingaphezu kuka-130 nokuhumusha okuzenzakalelayo."
          })}
        </script>
      </Helmet>

      <Header />

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Ukubhala Imihlangano nge-AI
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            I-Dicta-Notes ibhala imihlangano yakho ngesikhathi esigcwele isebenzisa ubuhlakani bokwenziwa obuphezulu be-Google Gemini 2.5 Pro. Ihlonza ngokuzenzakalelayo abasebenzi abalinganiselwa ku-10+ abahlukene futhi ihumusha ngezilimi ezingaphezu kuka-130.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12 text-left">
            <div className="flex gap-3">
              <MonitorSpeaker className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Ukubhala Ngesikhathi Esigcwele</h3>
                <p className="text-sm text-muted-foreground">Iguqula izingxoxo zibe umbhalo onembayo njengoba kwenzeka.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Ukuhlonza Abasebenzi</h3>
                <p className="text-sm text-muted-foreground">Ihlukanisa ngokuzenzakalelayo phakathi kwabahlanganyeli abayi-10+.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Languages className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Izilimi Eziyi-130+</h3>
                <p className="text-sm text-muted-foreground">Humusha imibhalo kuya kunoma yiluphi ulimi oluyinhloko.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Download className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Ukukhipha Okushintshashintshayo</h3>
                <p className="text-sm text-muted-foreground">Dawuniloda nge-TXT, i-Markdown noma yabelane ngqo.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Isebenza Ungaxhunyiwe</h3>
                <p className="text-sm text-muted-foreground">Uhlelo lokusebenza lweWebhu oluthuthukayo (PWA) elinamandla okusebenza ungaxhunyiwe.</p>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={handleStartTranscribing} className="px-8">
            Qala Ukubhala Mahhala
          </Button>
        </div>
      </section>
    </div>
  );
}
