import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MonitorSpeaker, Users, Languages, Download, Globe } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

export default function Arabic() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Arabic Landing Page', { language: 'ar' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'ar');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen" dir="rtl">
      <Helmet>
        <html lang="ar" dir="rtl" />
        <title>Dicta-Notes | تفريغ اجتماعات بالذكاء الاصطناعي في الوقت الفعلي</title>
        <meta name="description" content="يستخدم Dicta-Notes الذكاء الاصطناعي المتقدم لتفريغ الاجتماعات في الوقت الفعلي مع تحديد المتحدثين. دعم لأكثر من 130 لغة، التفريغ باستخدام Google Gemini 2.5، والتصدير بصيغ متعددة." />
        <link rel="canonical" href="https://dicta-notes.com/arabic" />
        
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
        <meta property="og:title" content="Dicta-Notes | تفريغ بالذكاء الاصطناعي" />
        <meta property="og:description" content="تفريغ اجتماعات في الوقت الفعلي مع تحديد المتحدثين. دعم لأكثر من 130 لغة." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/arabic" />
        <meta property="og:locale" content="ar_AR" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "ar",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "تفريغ اجتماعات في الوقت الفعلي مع تحديد المتحدثين بالذكاء الاصطناعي. دعم لأكثر من 130 لغة مع الترجمة التلقائية."
          })}
        </script>
      </Helmet>

      <Header />

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            تفريغ اجتماعات بالذكاء الاصطناعي
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            يقوم Dicta-Notes بتفريغ اجتماعاتك في الوقت الفعلي باستخدام الذكاء الاصطناعي المتقدم من Google Gemini 2.5. يحدد تلقائياً ما يصل إلى 10+ متحدثين مختلفين ويترجم إلى أكثر من 130 لغة.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12 text-right">
            <div className="flex gap-3 flex-row-reverse">
              <MonitorSpeaker className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">تفريغ في الوقت الفعلي</h3>
                <p className="text-sm text-muted-foreground">يحول المحادثات إلى نص دقيق أثناء حدوثها.</p>
              </div>
            </div>
            <div className="flex gap-3 flex-row-reverse">
              <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">تحديد المتحدثين</h3>
                <p className="text-sm text-muted-foreground">يميز تلقائياً بين 10+ مشاركين.</p>
              </div>
            </div>
            <div className="flex gap-3 flex-row-reverse">
              <Languages className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">130+ لغة</h3>
                <p className="text-sm text-muted-foreground">ترجم التفريغات إلى أي لغة رئيسية.</p>
              </div>
            </div>
            <div className="flex gap-3 flex-row-reverse">
              <Download className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">تصدير مرن</h3>
                <p className="text-sm text-muted-foreground">تنزيل بصيغة TXT أو Markdown أو المشاركة مباشرة.</p>
              </div>
            </div>
            <div className="flex gap-3 flex-row-reverse">
              <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">يعمل دون اتصال</h3>
                <p className="text-sm text-muted-foreground">تطبيق ويب تقدمي (PWA) مع إمكانية العمل دون اتصال.</p>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={handleStartTranscribing} className="px-8">
            ابدأ التفريغ مجاناً
          </Button>
        </div>
      </section>
    </div>
  );
}
