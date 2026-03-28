import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MonitorSpeaker, Users, Languages, Download, Globe } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

export default function Turkish() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Turkish Landing Page', { language: 'tr' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'tr');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="tr" />
        <title>Dicta-Notes | Türkçe Toplantılar için AI Sesli Notlar</title>
        <meta name="description" content="Dicta-Notes gelişmiş AI ile Türkçe toplantılarınız için gerçek zamanlı transkripsiyon ve konuşmacı tanıma sağlar. 130+ dilde otomatik çeviri desteği." />
        <link rel="canonical" href="https://dicta-notes.com/turkish" />
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
        <meta property="og:title" content="Dicta-Notes | Türkçe AI Notlar" />
        <meta property="og:description" content="Konuşmacı tanıma ile gerçek zamanlı toplantı transkripti. 130+ dil desteği." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/turkish" />
        <meta property="og:locale" content="tr_TR" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "tr",
            "url": "https://dicta-notes.com/turkish",
            "@id": "https://dicta-notes.com/turkish",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "AI ile konuşmacı tanıma ile gerçek zamanlı toplantı transkripti. Otomatik çeviri ile 130+ dil desteği."
          })}
        </script>
      </Helmet>

      <Header />

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            AI ile Toplantı Transkripti
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Dicta-Notes toplantılarınızı gelişmiş Google Gemini 2.5 kullanarak gerçek zamanlı olarak deşifre eder. Otomatik olarak 10+ farklı konuşmacıyı tanır ve 130+ dile çevirir.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12 text-left">
            <div className="flex gap-3">
              <MonitorSpeaker className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Gerçek Zamanlı Transkripsiyon</h3>
                <p className="text-sm text-muted-foreground">Konuşmaları gerçekleşirken doğru metne dönüştürür.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Konuşmacı Tanıma</h3>
                <p className="text-sm text-muted-foreground">10+ katılımcı arasında otomatik olarak ayrım yapar.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Languages className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">130+ Dil</h3>
                <p className="text-sm text-muted-foreground">Transkriptleri herhangi bir ana dile çevirin.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Download className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Esnek Dışa Aktarma</h3>
                <p className="text-sm text-muted-foreground">TXT, Markdown olarak indirin veya doğrudan paylaşın.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Çevrimdışı Çalışır</h3>
                <p className="text-sm text-muted-foreground">Çevrimdışı özellikli İlerici Web Uygulaması (PWA).</p>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={handleStartTranscribing} className="px-8">
            Ücretsiz Transkripsiyon Başlat
          </Button>

          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-3">Dicta-Notes'u diğer dillerde görüntüleyin:</p>
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
