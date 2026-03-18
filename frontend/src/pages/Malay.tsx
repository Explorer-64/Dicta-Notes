import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MonitorSpeaker, Users, Languages, Download, Globe } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

export default function Malay() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Malay Landing Page', { language: 'ms' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'ms');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="ms" />
        <title>Dicta-Notes | Transkripsi Mesyuarat Masa Nyata dengan AI</title>
        <meta name="description" content="Dicta-Notes menggunakan AI termaju untuk mentranskrip mesyuarat secara masa nyata dengan pengenalan penceramah. Menyokong lebih 130 bahasa, transkripsi dengan Gemini 2.5 Pro, dan eksport dalam pelbagai format." />
        <link rel="canonical" href="https://dicta-notes.com/malay" />
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
        <meta property="og:title" content="Dicta-Notes | Transkripsi Mesyuarat AI" />
        <meta property="og:description" content="Transkripsi mesyuarat masa nyata dengan pengenalan penceramah. Lebih 130 bahasa disokong." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/malay" />
        <meta property="og:locale" content="ms_MY" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "ms",
            "url": "https://dicta-notes.com/malay",
            "@id": "https://dicta-notes.com/malay",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Transkripsi mesyuarat masa nyata dengan pengenalan penceramah berasaskan AI. Menyokong lebih 130 bahasa dengan terjemahan automatik."
          })}
        </script>
      </Helmet>

      <Header />

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Transkripsi Mesyuarat dengan AI
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Dicta-Notes mentranskrip mesyuarat anda secara masa nyata menggunakan kecerdasan buatan termaju Google Gemini 2.5 Pro. Mengenal pasti sehingga 10+ penceramah berbeza secara automatik dan menterjemah ke lebih 130 bahasa.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12 text-left">
            <div className="flex gap-3">
              <MonitorSpeaker className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Transkripsi Masa Nyata</h3>
                <p className="text-sm text-muted-foreground">Menukar perbualan kepada teks tepat semasa ia berlaku.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Pengenalan Penceramah</h3>
                <p className="text-sm text-muted-foreground">Membezakan secara automatik antara 10+ peserta.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Languages className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">130+ Bahasa</h3>
                <p className="text-sm text-muted-foreground">Terjemah transkripsi ke mana-mana bahasa utama.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Download className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Eksport Fleksibel</h3>
                <p className="text-sm text-muted-foreground">Muat turun dalam TXT, Markdown atau kongsi terus.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Berfungsi Luar Talian</h3>
                <p className="text-sm text-muted-foreground">Aplikasi web progresif (PWA) dengan keupayaan luar talian.</p>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={handleStartTranscribing} className="px-8">
            Mula Transkripsi Percuma
          </Button>
        </div>
      </section>
    </div>
  );
}
