import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MonitorSpeaker, Users, Languages, Download, Globe } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

export default function Thai() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Thai Landing Page', { language: 'th' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'th');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="th" />
        <title>Dicta-Notes | บันทึกเสียง AI สำหรับการประชุมภาษาไทย</title>
        <meta name="description" content="Dicta-Notes ให้บริการถอดเสียงแบบเรียลไทม์และการจดจำผู้พูดด้วย AI ขั้นสูงสำหรับการประชุมภาษาไทย รองรับการแปลอัตโนมัติในกว่า 130 ภาษา" />
        <link rel="canonical" href="https://dicta-notes.com/thai" />
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
        <meta property="og:title" content="Dicta-Notes | บันทึก AI ภาษาไทย" />
        <meta property="og:description" content="ถอดเสียงการประชุมแบบเรียลไทม์พร้อมการจดจำผู้พูด รองรับกว่า 130 ภาษา" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/thai" />
        <meta property="og:locale" content="th_TH" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "th",
            "url": "https://dicta-notes.com/thai",
            "@id": "https://dicta-notes.com/thai",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "ถอดเสียงการประชุมแบบเรียลไทม์พร้อมการจดจำผู้พูดด้วย AI รองรับกว่า 130 ภาษาพร้อมการแปลอัตโนมัติ"
          })}
        </script>
      </Helmet>

      <Header />

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            ถอดเสียงการประชุมด้วย AI
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Dicta-Notes ถอดเสียงการประชุมของคุณแบบเรียลไทม์ด้วย Google Gemini 2.5 ขั้นสูง จดจำผู้พูดได้มากถึง 10+ คนโดยอัตโนมัติและแปลได้กว่า 130 ภาษา
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12 text-left">
            <div className="flex gap-3">
              <MonitorSpeaker className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">ถอดเสียงแบบเรียลไทม์</h3>
                <p className="text-sm text-muted-foreground">แปลงการสนทนาเป็นข้อความที่แม่นยำขณะที่กำลังเกิดขึ้น</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">การจดจำผู้พูด</h3>
                <p className="text-sm text-muted-foreground">แยกแยะผู้เข้าร่วมมากกว่า 10+ คนโดยอัตโนมัติ</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Languages className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">130+ ภาษา</h3>
                <p className="text-sm text-muted-foreground">แปลบันทึกเป็นภาษาหลักใดก็ได้</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Download className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">การส่งออกที่ยืดหยุ่น</h3>
                <p className="text-sm text-muted-foreground">ดาวน์โหลดเป็น TXT, Markdown หรือแชร์โดยตรง</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">ใช้งานออฟไลน์ได้</h3>
                <p className="text-sm text-muted-foreground">Progressive Web App (PWA) พร้อมความสามารถออฟไลน์</p>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={handleStartTranscribing} className="px-8">
            เริ่มการถอดเสียงฟรี
          </Button>

          <div className="mt-12 pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-3">ดู Dicta-Notes ในภาษาอื่น:</p>
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
