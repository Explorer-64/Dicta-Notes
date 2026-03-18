import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MonitorSpeaker, Users, Languages, Download, Globe } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

export default function Punjabi() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Punjabi Landing Page', { language: 'pa' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'pa');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="pa" />
        <title>Dicta-Notes | ਪੰਜਾਬੀ ਮੀਟਿੰਗਾਂ ਲਈ ਏਆਈ ਵੌਇਸ ਨੋਟਸ</title>
        <meta name="description" content="Dicta-Notes ਤੁਹਾਡੀਆਂ ਪੰਜਾਬੀ ਮੀਟਿੰਗਾਂ ਲਈ ਉੱਨਤ ਏਆਈ ਨਾਲ ਰੀਅਲ-ਟਾਈਮ ਟ੍ਰਾਂਸਕ੍ਰਿਪਸ਼ਨ ਅਤੇ ਸਪੀਕਰ ਪਛਾਣ ਪ੍ਰਦਾਨ ਕਰਦਾ ਹੈ। 130+ ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ ਸਵੈਚਾਲਤ ਅਨੁਵਾਦ ਸਮਰਥਨ।" />
        <link rel="canonical" href="https://dicta-notes.com/punjabi" />
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
        <meta property="og:title" content="Dicta-Notes | ਪੰਜਾਬੀ ਵਿੱਚ ਏਆਈ ਨੋਟਸ" />
        <meta property="og:description" content="ਸਪੀਕਰ ਪਛਾਣ ਦੇ ਨਾਲ ਰੀਅਲ-ਟਾਈਮ ਮੀਟਿੰਗ ਟ੍ਰਾਂਸਕ੍ਰਿਪਸ਼ਨ। 130+ ਭਾਸ਼ਾਵਾਂ ਦੀ ਸਹਾਇਤਾ।" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/punjabi" />
        <meta property="og:locale" content="pa_IN" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "pa",
            "url": "https://dicta-notes.com/punjabi",
            "@id": "https://dicta-notes.com/punjabi",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "ਏਆਈ ਨਾਲ ਸਪੀਕਰ ਪਛਾਣ ਦੇ ਨਾਲ ਰੀਅਲ-ਟਾਈਮ ਮੀਟਿੰਗ ਟ੍ਰਾਂਸਕ੍ਰਿਪਸ਼ਨ। ਸਵੈਚਾਲਤ ਅਨੁਵਾਦ ਨਾਲ 130+ ਭਾਸ਼ਾਵਾਂ ਦੀ ਸਹਾਇਤਾ।"
          })}
        </script>
      </Helmet>

      <Header />

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            ਏਆਈ ਨਾਲ ਮੀਟਿੰਗ ਟ੍ਰਾਂਸਕ੍ਰਿਪਸ਼ਨ
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Dicta-Notes ਤੁਹਾਡੀਆਂ ਮੀਟਿੰਗਾਂ ਨੂੰ ਉੱਨਤ Google Gemini 2.5 Pro ਏਆਈ ਦੀ ਵਰਤੋਂ ਕਰਕੇ ਰੀਅਲ-ਟਾਈਮ ਵਿੱਚ ਟ੍ਰਾਂਸਕ੍ਰਾਈਬ ਕਰਦਾ ਹੈ। ਸਵੈਚਾਲਤ ਤੌਰ 'ਤੇ 10+ ਵੱਖਰੇ ਸਪੀਕਰਾਂ ਦੀ ਪਛਾਣ ਕਰਦਾ ਹੈ ਅਤੇ 130+ ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ ਅਨੁਵਾਦ ਕਰਦਾ ਹੈ.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12 text-left">
            <div className="flex gap-3">
              <MonitorSpeaker className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">ਰੀਅਲ-ਟਾਈਮ ਟ੍ਰਾਂਸਕ੍ਰਿਪਸ਼ਨ</h3>
                <p className="text-sm text-muted-foreground">ਗੱਲਬਾਤ ਨੂੰ ਸਹੀ ਟੈਕਸਟ ਵਿੱਚ ਬਦਲਦਾ ਹੈ ਜਿਵੇਂ ਉਹ ਵਾਪਰ ਰਹੀਆਂ ਹਨ।</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">ਸਪੀਕਰ ਪਛਾਣ</h3>
                <p className="text-sm text-muted-foreground">ਸਵੈਚਾਲਤ ਤੌਰ 'ਤੇ 10+ ਭਾਗੀਦਾਰਾਂ ਵਿੱਚ ਫਰਕ ਕਰਦਾ ਹੈ।</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Languages className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">130+ ਭਾਸ਼ਾਵਾਂ</h3>
                <p className="text-sm text-muted-foreground">ਟ੍ਰਾਂਸਕ੍ਰਿਪਟਾਂ ਦਾ ਕਿਸੇ ਵੀ ਮੁੱਖ ਭਾਸ਼ਾ ਵਿੱਚ ਅਨੁਵਾਦ ਕਰੋ।</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Download className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">ਲਚਕੀਲਾ ਨਿਰਯਾਤ</h3>
                <p className="text-sm text-muted-foreground">TXT, Markdown ਵਜੋਂ ਡਾਊਨਲੋਡ ਕਰੋ ਜਾਂ ਸਿੱਧੇ ਸਾਂਝਾ ਕਰੋ।</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">ਔਫਲਾਈਨ ਕੰਮ ਕਰਦਾ ਹੈ</h3>
                <p className="text-sm text-muted-foreground">ਔਫਲਾਈਨ ਸਮਰੱਥਾ ਨਾਲ ਪ੍ਰੋਗਰੈਸਿਵ ਵੈੱਬ ਐਪ (PWA)।</p>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={handleStartTranscribing} className="px-8">
            ਮੁਫ਼ਤ ਟਰਾਂਸਕ੍ਰਿਪਸ਼ਨ ਸ਼ੁਰੂ ਕਰੋ
          </Button>

          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-3">ਹੋਰ ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ Dicta-Notes ਦੇਖੋ:</p>
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
