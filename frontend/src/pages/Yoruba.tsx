import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MonitorSpeaker, Users, Languages, Download, Globe } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

export default function Yoruba() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Yoruba Landing Page', { language: 'yo' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'yo');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="yo" />
        <title>Dicta-Notes | Ìkọ̀wé Ìpàdé Lásìkò-gangan pẹ̀lú AI</title>
        <meta name="description" content="Dicta-Notes nlo AI to ga julọ lati kọ awọn ipade ni akoko gangan pẹlu idanimọ awọn agbọrọsọ. O ṣe atilẹyin awọn ede to ju 130 lọ, kikọ pẹlu Google Gemini 2.5, ati gbigbe jade ni awọn ọna oriṣiriṣi." />
        <link rel="canonical" href="https://dicta-notes.com/yo" />
        
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
        <meta property="og:title" content="Dicta-Notes | Ìkọ̀wé Ìpàdé pẹ̀lú AI" />
        <meta property="og:description" content="Ìkọ̀wé ìpàdé lásìkò-gangan pẹ̀lú ìdánimọ̀ àwọn agbọ̀rọ̀sọ. Àwọn èdè tó ju 130 lọ ni a ń ṣe àtìlẹ́yìn." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/yoruba" />
        <meta property="og:locale" content="yo_NG" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "yo",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Ìkọ̀wé ìpàdé lásìkò-gangan pẹ̀lú ìdánimọ̀ àwọn agbọ̀rọ̀sọ nípa AI. Ó ṣe àtìlẹ́yìn àwọn èdè tó ju 130 lọ pẹ̀lú ìtumọ̀ aládàáṣe."
          })}
        </script>
      </Helmet>

      <Header />

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Ìkọ̀wé Ìpàdé pẹ̀lú AI
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Dicta-Notes ń kọ àwọn ìpàdé rẹ lásìkò-gangan nípa lílọ ọgbọ́n oríkàn tó ga jùlọ ti Google Gemini 2.5. Ó ń mọ̀ títí dé àwọn agbọ̀rọ̀sọ 10+ tó yàtọ̀ láìsí ìrànlọ́wọ́ àti tumọ̀ sí èdè tó ju 130 lọ.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12 text-left">
            <div className="flex gap-3">
              <MonitorSpeaker className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Ìkọ̀wé Lásìkò-gangan</h3>
                <p className="text-sm text-muted-foreground">Ó ń pa àwọn ìjíròrò dà sí ọ̀rọ̀-kíkọ̀ tó péye bí ó ṣe ń ṣẹlẹ̀.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Ìdánimọ̀ Àwọn Agbọ̀rọ̀sọ</h3>
                <p className="text-sm text-muted-foreground">Ó ń ṣe ìyàtọ̀ láìsí ìrànlọ́wọ́ láàárín àwọn olùkópa 10+.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Languages className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Àwọn Èdè 130+</h3>
                <p className="text-sm text-muted-foreground">Tumọ̀ àwọn ìkọ̀wé sí èdè pàtàkì èyíkéyìí.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Download className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Gbígbé Jáde Tó Rọrùn</h3>
                <p className="text-sm text-muted-foreground">Ṣe ìgbàsílẹ̀ nínú TXT, Markdown tàbí pín ní tààrà.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Ó Ṣiṣẹ́ Láìsí Íńtánẹ́ẹ̀tì</h3>
                <p className="text-sm text-muted-foreground">Ètò ayélujára tó ń tẹ̀síwájú (PWA) pẹ̀lú agbára láìsí íńtánẹ́ẹ̀tì.</p>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={handleStartTranscribing} className="px-8">
            Bẹrẹ Kikọ Ọfẹ
          </Button>

          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-3">Wo Dicta-Notes ní àwọn èdè míràn:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>English</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/french')}>Français</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/portuguese')}>Português</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/swahili')}>Kiswahili</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/hausa')}>Hausa</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/afrikaans')}>Afrikaans</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/arabic')}>العربية</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
