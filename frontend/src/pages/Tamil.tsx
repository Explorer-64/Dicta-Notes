import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MonitorSpeaker, Users, Languages, Download, Globe } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

export default function Tamil() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Tamil Landing Page', { language: 'ta' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'ta');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="ta" />
        <title>Dicta-Notes | தமிழ் கூட்டங்களுக்கான AI குரல் குறிப்புகள்</title>
        <meta name="description" content="உங்கள் தமிழ் கூட்டங்களுக்கு மேம்பட்ட AIஇன் மூலம் நேரடி படியெடுத்தல் மற்றும் பேச்சாளர் அங்கீகாரத்தை Dicta-Notes வழங்குகிறது. 130+ மொழிகளில் தானியங்கு மொழிபெயர்ப்பு ஆதரவு." />
        <link rel="canonical" href="https://dicta-notes.com/tamil" />
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
        <meta property="og:title" content="Dicta-Notes | தமிழில் AI குறிப்புகள்" />
        <meta property="og:description" content="பேச்சாளர் அங்கீகாரத்துடன் நேரடி கூட்ட படியெடுத்தல். 130+ மொழி ஆதரவு." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/tamil" />
        <meta property="og:locale" content="ta_IN" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "ta",
            "url": "https://dicta-notes.com/tamil",
            "@id": "https://dicta-notes.com/tamil",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "AIஇன் மூலம் பேச்சாளர் அங்கீகாரத்துடன் நேரடி கூட்ட படியெடுத்தல். தானியங்கு மொழிபெயர்ப்புடன் 130+ மொழி ஆதரவு."
          })}
        </script>
      </Helmet>

      <Header />

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            AIஇன் மூலம் கூட்ட படியெடுத்தல்
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Dicta-Notes உங்கள் கூட்டங்களை மேம்பட்ட Google Gemini 2.5 Pro AI பயன்படுத்தி நேரடியாக படியெடுக்கிறது. தானாகவே 10+ வெவ்வேறு பேச்சாளர்களை அடையாளம் கண்டு 130+ மொழிகளுக்கு மொழிபெயர்க்கிறது.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12 text-left">
            <div className="flex gap-3">
              <MonitorSpeaker className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">நேரடி படியெடுத்தல்</h3>
                <p className="text-sm text-muted-foreground">உரையாடல்கள் நடக்கும்போதே துல்லியமான உரையாக மாற்றுகிறது.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">பேச்சாளர் அங்கீகாரம்</h3>
                <p className="text-sm text-muted-foreground">தானாகவே 10+ பங்கேற்பாளர்களிடையே வேறுபடுத்துகிறது.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Languages className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">130+ மொழிகள்</h3>
                <p className="text-sm text-muted-foreground">படியெடுப்புகளை எந்த முக்கிய மொழிக்கும் மொழிபெயர்க்கவும்.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Download className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">நெகிழ்வான ஏற்றுமதி</h3>
                <p className="text-sm text-muted-foreground">TXT, Markdown ஆக பதிவிறக்கம் செய்யவும் அல்லது நேரடியாக பகிரவும்.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">ஆஃப்லைனில் வேலை செய்கிறது</h3>
                <p className="text-sm text-muted-foreground">ஆஃப்லைன் திறனுடன் முற்போக்கான வலை பயன்பாடு (PWA).</p>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={handleStartTranscribing} className="px-8">
            இலவச டிரான்ஸ்கிரிப்ஷனை தொடங்கவும்
          </Button>

          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-3">பிற மொழிகளில் Dicta-Notesஐ பார்க்கவும்:</p>
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
