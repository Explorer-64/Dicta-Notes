import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MonitorSpeaker, Users, Languages, Download, Globe } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

export default function Hindi() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Hindi Landing Page', { language: 'hi' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'hi');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="hi" />
        <title>Dicta-Notes | AI द्वारा रीयल-टाइम मीटिंग ट्रांसक्रिप्शन</title>
        <meta name="description" content="Dicta-Notes उन्नत AI का उपयोग करके रीयल-टाइम में मीटिंग को ट्रांसक्राइब करता है और वक्ताओं की पहचान करता है। 130+ भाषाओं का समर्थन, Gemini 2.5 Pro के साथ ट्रांसक्रिप्शन, और कई फॉर्मेट में एक्सपोर्ट।" />
        <link rel="canonical" href="https://dicta-notes.com/hindi" />
        
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
        <meta property="og:title" content="Dicta-Notes | AI ट्रांसक्रिप्शन" />
        <meta property="og:description" content="वक्ता पहचान के साथ रीयल-टाइम मीटिंग ट्रांसक्रिप्शन। 130+ भाषाओं का समर्थन।" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/hindi" />
        <meta property="og:locale" content="hi_IN" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "hi",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "AI द्वारा वक्ता पहचान के साथ रीयल-टाइम मीटिंग ट्रांसक्रिप्शन। स्वचालित अनुवाद के साथ 130+ भाषाओं का समर्थन।"
          })}
        </script>
      </Helmet>

      <Header />

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            AI मीटिंग ट्रांसक्रिप्शन
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Dicta-Notes Google Gemini 2.5 Pro के उन्नत आर्टिफिशियल इंटेलिजेंस का उपयोग करके आपकी मीटिंग को रीयल-टाइम में ट्रांसक्राइब करता है। स्वचालित रूप से 10+ विभिन्न वक्ताओं की पहचान करता है और 130+ भाषाओं में अनुवाद करता है।
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12 text-left">
            <div className="flex gap-3">
              <MonitorSpeaker className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">रीयल-टाइम ट्रांसक्रिप्शन</h3>
                <p className="text-sm text-muted-foreground">बातचीत को सटीक टेक्स्ट में रीयल-टाइम में बदलता है।</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">वक्ता पहचान</h3>
                <p className="text-sm text-muted-foreground">स्वचालित रूप से 10+ प्रतिभागियों के बीच अंतर करता है।</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Languages className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">130+ भाषाएं</h3>
                <p className="text-sm text-muted-foreground">ट्रांसक्रिप्शन का किसी भी प्रमुख भाषा में अनुवाद करें।</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Download className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">लचीला एक्सपोर्ट</h3>
                <p className="text-sm text-muted-foreground">TXT, Markdown में डाउनलोड करें या सीधे शेयर करें।</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">ऑफ़लाइन काम करता है</h3>
                <p className="text-sm text-muted-foreground">ऑफ़लाइन क्षमता के साथ प्रोग्रेसिव वेब ऐप (PWA)।</p>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={handleStartTranscribing} className="px-8">
            निःशुल्क ट्रांसक्रिप्शन शुरू करें
          </Button>
        </div>
      </section>
    </div>
  );
}
