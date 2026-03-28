import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MonitorSpeaker, Users, Languages, Download, Globe } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

export default function Vietnamese() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Vietnamese Landing Page', { language: 'vi' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'vi');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="vi" />
        <title>Dicta-Notes | Ghi Chú Giọng Nói AI cho Cuộc Họp bằng Tiếng Việt</title>
        <meta name="description" content="Dicta-Notes sử dụng AI tiên tiến để phiên âm cuộc họp thời gian thực với nhận dạng người nói. Hỗ trợ hơn 130 ngôn ngữ với dịch tự động." />
        <link rel="canonical" href="https://dicta-notes.com/vietnamese" />
        
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
        <meta property="og:title" content="Dicta-Notes | Ghi Chú AI bằng Tiếng Việt" />
        <meta property="og:description" content="Phiên âm cuộc họp thời gian thực với nhận dạng người nói. Hỗ trợ hơn 130 ngôn ngữ." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/vietnamese" />
        <meta property="og:locale" content="vi_VN" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "vi",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Phiên âm cuộc họp thời gian thực với nhận dạng người nói bằng AI. Hỗ trợ hơn 130 ngôn ngữ với dịch tự động."
          })}
        </script>
      </Helmet>

      <Header />

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Ghi Chú Cuộc Họp Bằng AI
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Dicta-Notes phiên âm cuộc họp của bạn theo thời gian thực bằng Google Gemini 2.5 tiên tiến. Tự động nhận dạng tới 10+ người nói khác nhau và dịch sang hơn 130 ngôn ngữ.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12 text-left">
            <div className="flex gap-3">
              <MonitorSpeaker className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Phiên Âm Thời Gian Thực</h3>
                <p className="text-sm text-muted-foreground">Chuyển đổi cuộc trò chuyện thành văn bản chính xác khi chúng diễn ra.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Nhận Dạng Người Nói</h3>
                <p className="text-sm text-muted-foreground">Tự động phân biệt giữa 10+ người tham gia.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Languages className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">130+ Ngôn Ngữ</h3>
                <p className="text-sm text-muted-foreground">Dịch bản phiên âm sang bất kỳ ngôn ngữ chính nào.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Download className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Xuất Linh Hoạt</h3>
                <p className="text-sm text-muted-foreground">Tải xuống dưới dạng TXT, Markdown hoặc chia sẻ trực tiếp.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Hoạt Động Ngoại Tuyến</h3>
                <p className="text-sm text-muted-foreground">Ứng dụng Web Tiến Bộ (PWA) với khả năng ngoại tuyến.</p>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={handleStartTranscribing} className="px-8">
            Bắt đầu phiên âm miễn phí
          </Button>
        </div>
      </section>
    </div>
  );
}
