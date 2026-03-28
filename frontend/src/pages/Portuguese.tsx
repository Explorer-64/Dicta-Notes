import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MonitorSpeaker, Users, Languages, Download, Globe } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

export default function Portuguese() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Portuguese Landing Page', { language: 'pt' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'pt');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="pt" />
        <title>Dicta-Notes | Transcrição de Reuniões com IA em Tempo Real</title>
        <meta name="description" content="Dicta-Notes utiliza IA avançada para transcrever reuniões em tempo real com identificação de palestrantes. Suporte para mais de 130 idiomas, transcrição com Google Gemini 2.5 e exportação em múltiplos formatos." />
        <link rel="canonical" href="https://dicta-notes.com/portuguese" />
        
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
        <meta property="og:title" content="Dicta-Notes | Transcrição com IA" />
        <meta property="og:description" content="Transcrição de reuniões em tempo real com identificação de palestrantes. Mais de 130 idiomas suportados." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/portuguese" />
        <meta property="og:locale" content="pt_PT" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "pt",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Transcrição de reuniões em tempo real com identificação de palestrantes por IA. Suporta mais de 130 idiomas com tradução automática."
          })}
        </script>
      </Helmet>

      <Header />

      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Transcrição de Reuniões com IA
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Dicta-Notes transcreve suas reuniões em tempo real utilizando inteligência artificial avançada do Google Gemini 2.5. Identifica automaticamente até 10+ palestrantes diferentes e traduz para mais de 130 idiomas.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12 text-left">
            <div className="flex gap-3">
              <MonitorSpeaker className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Transcrição em Tempo Real</h3>
                <p className="text-sm text-muted-foreground">Converte conversas em texto preciso enquanto acontecem.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Identificação de Palestrantes</h3>
                <p className="text-sm text-muted-foreground">Diferencia automaticamente entre 10+ participantes.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Languages className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">130+ Idiomas</h3>
                <p className="text-sm text-muted-foreground">Traduza transcrições para qualquer idioma principal.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Download className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Exportação Flexível</h3>
                <p className="text-sm text-muted-foreground">Baixe em TXT, Markdown ou compartilhe diretamente.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Funciona Offline</h3>
                <p className="text-sm text-muted-foreground">Aplicativo web progressivo (PWA) com capacidade offline.</p>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={handleStartTranscribing} className="px-8">
            Começar Transcrição Grátis
          </Button>
        </div>
      </section>
    </div>
  );
}
