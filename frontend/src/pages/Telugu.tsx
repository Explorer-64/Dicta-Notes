import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MonitorSpeaker, Users, Languages, Download, Globe } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

export default function Telugu() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Telugu Landing Page', { language: 'te' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'te');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="te" />
        <title>Dicta-Notes | తెలుగు సమావేశాల కోసం AI వాయిస్ నోట్స్</title>
        <meta name="description" content="మీ తెలుగు సమావేశాల కోసం అధునాతన AIతో రియల్-టైమ్ ట్రాన్స్‌క్రిప్షన్ మరియు స్పీకర్ గుర్తింపును Dicta-Notes అందిస్తుంది. 130+ భాషలలో ఆటోమేటిక్ అనువాద మద్దతు." />
        <link rel="canonical" href="https://dicta-notes.com/telugu" />
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
        <meta property="og:title" content="Dicta-Notes | తెలుగులో AI నోట్స్" />
        <meta property="og:description" content="స్పీకర్ గుర్తింపుతో రియల్-టైమ్ సమావేశ ట్రాన్స్‌క్రిప్షన్. 130+ భాషల మద్దతు." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/telugu" />
        <meta property="og:locale" content="te_IN" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "te",
            "url": "https://dicta-notes.com/telugu",
            "@id": "https://dicta-notes.com/telugu",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "AIతో స్పీకర్ గుర్తింపుతో రియల్-టైమ్ సమావేశ ట్రాన్స్‌క్రిప్షన్. ఆటోమేటిక్ అనువాదంతో 130+ భాషల మద్దతు."
          })}
        </script>
      </Helmet>

      <Header />

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            AIతో సమావేశ ట్రాన్స్‌క్రిప్షన్
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Dicta-Notes మీ సమావేశాలను అధునాతన Google Gemini 2.5 ఉపయోగించి రియల్-టైమ్‌లో ట్రాన్స్‌క్రయిబ్ చేస్తుంది. స్వయంచాలకంగా 10+ వేర్వేరు స్పీకర్లను గుర్తిస్తుంది మరియు 130+ భాషలకు అనువదిస్తుంది.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12 text-left">
            <div className="flex gap-3">
              <MonitorSpeaker className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">రియల్-టైమ్ ట్రాన్స్‌క్రిప్షన్</h3>
                <p className="text-sm text-muted-foreground">సంభాషణలను అవి జరుగుతున్నప్పుడు ఖచ్చితమైన టెక్స్ట్‌గా మారుస్తుంది.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">స్పీకర్ గుర్తింపు</h3>
                <p className="text-sm text-muted-foreground">స్వయంచాలకంగా 10+ పాల్గొనేవారి మధ్య వ్యత్యాసాన్ని గుర్తిస్తుంది.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Languages className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">130+ భాషలు</h3>
                <p className="text-sm text-muted-foreground">ట్రాన్స్‌క్రిప్ట్‌లను ఏదైనా ప్రధాన భాషకు అనువదించండి.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Download className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">సరళమైన ఎగుమతి</h3>
                <p className="text-sm text-muted-foreground">TXT, Markdown రూపంలో డౌన్‌లోడ్ చేయండి లేదా నేరుగా భాగస్వామ్యం చేయండి.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">ఆఫ్‌లైన్ పనిచేస్తుంది</h3>
                <p className="text-sm text-muted-foreground">ఆఫ్‌లైన్ సామర్థ్యంతో ప్రోగ్రెసివ్ వెబ్ యాప్ (PWA).</p>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={handleStartTranscribing} className="px-8">
            ఉచిత ట్రాన్స్క్రిప్షన్ ప్రారంభించండి
          </Button>

          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-3">ఇతర భాషలలో Dicta-Notesను చూడండి:</p>
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
