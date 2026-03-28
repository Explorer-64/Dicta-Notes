import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Archive, Search, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

const featureHighlights = [
  {
    icon: <Clock className="h-8 w-8 text-blue-500" />,
    title: "Nutzen Sie Asynchrone Arbeit",
    description: "Ersetzen Sie Status-Update-Meetings durch durchsuchbare, zusammengefasste Transkripte. Halten Sie alle auf dem Laufenden, unabhängig von ihrer Zeitzone.",
  },
  {
    icon: <Search className="h-8 w-8 text-green-500" />,
    title: "Ein Durchsuchbares Team-Gedächtnis",
    description: "Jedes Gespräch wird Teil der kollektiven Wissensdatenbank Ihres Teams. Finden Sie sofort wichtige Entscheidungen, Fristen und Aktionspunkte.",
  },
  {
    icon: <Archive className="h-8 w-8 text-yellow-500" />,
    title: "Automatisierte Meeting-Notizen",
    description: "Erhalten Sie detaillierte, sprecheridentifizierte Notizen von Google Gemini 2.5. Konzentrieren Sie sich auf das Gespräch, nicht auf das Notieren.",
  },
];

const faqItems = [
  {
    question: "Wie hilft dies, Meeting-Müdigkeit zu reduzieren?",
    answer: "Durch zuverlässige und detaillierte Transkripte können Sie Status-Update-Meetings getrost überspringen. Teammitglieder können sich in ihrer eigenen Zeit auf den neuesten Stand bringen, was zu weniger, fokussierteren Live-Sitzungen führt."
  },
  {
    question: "Können wir dies mit unseren Projektmanagement-Tools integrieren?",
    answer: "Obwohl wir noch keine direkten Integrationen haben, können Sie Transkripte einfach in verschiedenen Formaten (Text, Markdown, Word) exportieren, um Aktionspunkte und Zusammenfassungen in Tools wie Asana, Jira oder Trello zu kopieren."
  },
  {
    question: "Was ist der Unterschied zwischen Browser-Sprache und der finalen Transkription?",
    answer: "Der Live-Text, den Sie während der Aufnahme sehen, dient der sofortigen UX-Rückmeldung. Die finale, hochpräzise Transkription wird von Google Gemini 2.5 aus dem gespeicherten Audio für maximale Qualität und Zuverlässigkeit verarbeitet."
  },
  {
    question: "Ist dies für vertrauliche interne Diskussionen geeignet?",
    answer: "Ja. Wir verwenden die sichere Infrastruktur von Firebase, um sicherzustellen, dass Ihre Daten verschlüsselt und geschützt sind. Es ist eine sichere Lösung für die meisten Geschäftskommunikationen, aber wir sind nicht HIPAA-konform."
  }
];

export default function RemoteTeamsDe() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Remote Teams DE Page', { language: 'de', niche: 'remote-teams' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'de');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="de" />
        <title>Dicta-Notes für Remote-Teams | KI-Transkription für Verteilte Teams</title>
        <meta name="description" content="KI-gestützte Meeting-Transkription für Remote- und verteilte Teams. Reduzieren Sie Meeting-Müdigkeit, ermöglichen Sie asynchrone Zusammenarbeit und bauen Sie eine durchsuchbare Wissensdatenbank über Zeitzonen hinweg auf." />
        <meta name="keywords" content="Remote-Team Transkription, verteilte Team-Meetings, asynchrone Meeting-Notizen, Zeitzone Zusammenarbeit, Remote-Arbeit Dokumentation, verteilte Team-Produktivität" />
        <link rel="canonical" href="https://dicta-notes.com/remote-teams-de" />
        
        {/* Hreflang tags */}
        <link rel="alternate" hrefLang="en" href="https://dicta-notes.com/remote-teams" />
        <link rel="alternate" hrefLang="fr" href="https://dicta-notes.com/remote-teams-fr" />
        <link rel="alternate" hrefLang="es" href="https://dicta-notes.com/remote-teams-es" />
        <link rel="alternate" hrefLang="de" href="https://dicta-notes.com/remote-teams-de" />
        <link rel="alternate" hrefLang="el" href="https://dicta-notes.com/remote-teams-el" />
        <link rel="alternate" hrefLang="ko" href="https://dicta-notes.com/remote-teams-ko" />
        <link rel="alternate" hrefLang="x-default" href="https://dicta-notes.com/remote-teams" />

        {/* Open Graph */}
        <meta property="og:title" content="Dicta-Notes für Remote-Teams" />
        <meta property="og:description" content="KI-Meeting-Transkription für verteilte Teams. Ermöglichen Sie asynchrone Zusammenarbeit über Zeitzonen hinweg mit automatischen Meeting-Notizen." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/remote-teams-de" />
        <meta property="og:locale" content="de_DE" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes für Remote-Teams",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "de",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "KI-gestützte Meeting-Transkription für Remote- und verteilte Teams. Reduzieren Sie Meeting-Müdigkeit, ermöglichen Sie asynchrone Zusammenarbeit und bauen Sie durchsuchbare Dokumentation über Zeitzonen hinweg mit Sprechererkennung in 130+ Sprachen auf.",
            "audience": {
              "@type": "BusinessAudience",
              "name": "Remote- und Verteilte Teams"
            }
          })}
        </script>
      </Helmet>
      <Header />

      <div className="bg-background text-foreground">
        {/* Hero Section */}
        <section className="text-center py-20 px-4 bg-gray-50 dark:bg-gray-900">
          <h1 className="text-4xl md:text-5xl font-bold">
            Mehr Produktivität, Weniger Zeit in Meetings
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Dicta-Notes gibt Ihrem Remote-Team die Kraft der asynchronen Kommunikation mit KI-transkribierten Meetings. Verwandeln Sie jedes Gespräch in umsetzbare, durchsuchbare Dokumentation.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={handleStartTranscribing}>
              Starten Sie Ihre Kostenlose Testversion
            </Button>
          </div>
        </section>

        {/* Translate Feature Notice */}
        <section className="py-8 px-4 bg-blue-50 dark:bg-blue-950/20">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-start">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100">💡 Tipp: App Übersetzen</p>
                <p className="text-blue-800 dark:text-blue-200 mt-1">
                  Wenn Sie auf "Starten Sie Ihre Kostenlose Testversion" klicken und auf die App zugreifen, kann die Benutzeroberfläche auf Englisch sein. Sie können sie einfach ins Deutsche (oder eine von über 130 Sprachen) übersetzen, indem Sie auf die Übersetzungsschaltfläche (Globus-Symbol 🌐) in der Kopfzeile oben auf der Seite klicken.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-16 px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold">Ertrinkt Ihr Verteiltes Team in Meetings?</h2>
            <p className="text-muted-foreground mt-4">
              Die Koordination über Zeitzonen hinweg führt oft zu Meeting-Überlastung, Informationssilos und endlosen Status-Updates, die die Produktivität töten.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Meeting-Müdigkeit</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Aufeinanderfolgende Videoanrufe lassen keine Zeit für tiefe Arbeit. Wichtige Gespräche werden gehetzt und Teammitglieder sind unengagiert.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Informationssilos</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Wichtige Entscheidungen, die in Meetings getroffen werden, gehen verloren, sobald der Anruf endet, nicht verfügbar für diejenigen, die nicht teilnehmen konnten.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Zeitzonen-Konflikte</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Teammitglieder werden zu frühen Morgen- oder späten Abendanrufen gezwungen, was zu Burnout und ungleicher Teilnahme führt.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Arbeiten Sie Klüger, Nicht Härter</h2>
            <p className="text-muted-foreground mt-2">
              Dicta-Notes ist für das moderne, asynchron-erste Remote-Team konzipiert.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-6xl mx-auto">
            {featureHighlights.map((feature, index) => (
              <div key={index} className="flex flex-col items-center text-center p-4">
                {feature.icon}
                <h3 className="text-xl font-semibold mt-4">{feature.title}</h3>
                <p className="text-muted-foreground mt-2">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Ihre Fragen, Beantwortet</h2>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{item.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-4 text-center bg-green-600 text-white">
          <h2 className="text-3xl font-bold">Bereit, die Zeit Ihres Teams Zurückzugewinnen?</h2>
          <p className="mt-4 max-w-2xl mx-auto">
            Befähigen Sie Ihr verteiltes Team mit den Tools, um effektiv zu kommunizieren, egal wo oder wann sie arbeiten.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={handleStartTranscribing}>
              Jetzt Kostenlose Testversion Starten
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-green-600" onClick={() => navigate("/pricing")}>
              Preise Ansehen
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
