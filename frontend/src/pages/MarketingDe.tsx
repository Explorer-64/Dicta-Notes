import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Users, FileText, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

const featureHighlights = [
  {
    icon: <Lightbulb className="h-8 w-8 text-blue-500" />,
    title: "Verlieren Sie Nie Eine Kreative Idee",
    description: "Erfassen Sie jedes Brainstorming, jeden Funken Kreativität. Unsere KI transkribiert Ihre Sitzungen, damit brillante Ideen nie verloren gehen.",
  },
  {
    icon: <Users className="h-8 w-8 text-green-500" />,
    title: "Mehrsprachige Team-Zusammenarbeit",
    description: "Arbeiten Sie nahtlos mit kreativen Teams über Sprachgrenzen hinweg. Echtzeit-Transkription unterstützt über 130 Sprachen für echte globale Zusammenarbeit.",
  },
  {
    icon: <FileText className="h-8 w-8 text-yellow-500" />,
    title: "Automatisierte Meeting-Dokumentation",
    description: "Konzentrieren Sie sich auf den kreativen Fluss, während wir die Notizen übernehmen. Erhalten Sie Transkripte mit Sprechererkennung für jede Kampagnenüberprüfung und Ideenfindung.",
  },
  {
    icon: <Globe className="h-8 w-8 text-purple-500" />,
    title: "Durchsuchbares Kreativ-Archiv",
    description: "Bauen Sie eine Wissensdatenbank kreativer Entscheidungen auf. Durchsuchen Sie vergangene Brainstormings, um das perfekte Konzept zu finden, das Sie vor Monaten besprochen haben.",
  },
];

const faqItems = [
  {
    question: "Wie hilft dies bei kreativen Brainstorming-Sitzungen?",
    answer: "Während des Brainstormings fließen Ideen schnell. Dicta-Notes erfasst automatisch jeden Vorschlag und jedes Konzept, sodass Ihr Team im kreativen Fluss bleiben kann, ohne sich um Notizen kümmern zu müssen. Überprüfen Sie später das vollständige Transkript, um die besten Ideen zu identifizieren."
  },
  {
    question: "Können wir dies für Kundenpräsentationen und Feedback-Sitzungen nutzen?",
    answer: "Absolut! Nehmen Sie Kundenmeetings, Design-Kritiken und Feedback-Sitzungen auf. Sie haben eine genaue Aufzeichnung von Kundenanfragen, kreativer Ausrichtung und Genehmigungsentscheidungen - perfekt für Referenz und Verantwortlichkeit."
  },
  {
    question: "Was ist mit mehrsprachigen Teams?",
    answer: "Dicta-Notes unterstützt über 130 Sprachen mit Sprechererkennung. Wenn Ihr kreatives Team mehrere Länder umfasst, kann jeder in seiner bevorzugten Sprache teilnehmen, und das Transkript erfasst alles."
  },
  {
    question: "Wie sicher sind unsere kreativen Inhalte?",
    answer: "Alle Transkripte sind verschlüsselt und sicher über die Firebase-Infrastruktur gespeichert. Ihre kreativen Konzepte, Kampagnenideen und Kundengespräche bleiben vertraulich und geschützt."
  }
];

export default function MarketingDe() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Marketing DE Page', { language: 'de', niche: 'marketing' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'de');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="de" />
        <title>Dicta-Notes für Marketing-Teams | KI-Transkription für Kreative</title>
        <meta name="description" content="KI-gestützte Transkription für Marketing-Teams und kreative Profis. Verlieren Sie nie eine brillante Idee aus Brainstorming-Sitzungen. Perfekt für Kampagnenplanung, Design-Reviews und mehrsprachige Zusammenarbeit." />
        <meta name="keywords" content="Marketing-Transkription, kreative Team-Meetings, Brainstorming-Dokumentation, Kampagnenplanung Notizen, Design-Review Transkription, mehrsprachige Marketing-Teams" />
        <link rel="canonical" href="https://dicta-notes.com/marketing-de" />
        
        {/* Hreflang tags for marketing pages */}
        <link rel="alternate" hrefLang="en" href="https://dicta-notes.com/marketing" />
        <link rel="alternate" hrefLang="fr" href="https://dicta-notes.com/marketing-fr" />
        <link rel="alternate" hrefLang="es" href="https://dicta-notes.com/marketing-es" />
        <link rel="alternate" hrefLang="de" href="https://dicta-notes.com/marketing-de" />
        <link rel="alternate" hrefLang="el" href="https://dicta-notes.com/marketing-el" />
        <link rel="alternate" hrefLang="ko" href="https://dicta-notes.com/marketing-ko" />
        <link rel="alternate" hrefLang="x-default" href="https://dicta-notes.com/marketing" />

        {/* Open Graph */}
        <meta property="og:title" content="Dicta-Notes für Marketing & Kreative Teams" />
        <meta property="og:description" content="KI-Transkription für Brainstorming, Kampagnenplanung und kreative Reviews. Verlieren Sie nie wieder eine großartige Idee." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/marketing-de" />
        <meta property="og:locale" content="de_DE" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes für Marketing-Teams",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "de",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "KI-gestützte Meeting-Transkription für Marketing- und Kreativ-Teams. Erfassen Sie Brainstorming-Sitzungen, Kampagnenplanung und Design-Reviews mit Sprechererkennung in über 130 Sprachen.",
            "audience": {
              "@type": "BusinessAudience",
              "name": "Marketing- und Kreativ-Profis"
            }
          })}
        </script>
      </Helmet>
      <Header />

      <div className="bg-background text-foreground">
        {/* Hero Section */}
        <section className="text-center py-20 px-4 bg-gray-50 dark:bg-gray-900">
          <h1 className="text-4xl md:text-5xl font-bold">
            Erfassen Sie Jeden Kreativen Funken
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Dicta-Notes verwandelt Ihre Brainstorming-Sitzungen und kreativen Meetings in durchsuchbare, umsetzbare Dokumentation. Konzentrieren Sie sich auf Innovation, während die KI die Notizen übernimmt.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={handleStartTranscribing}>
              Kostenlos Testen
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
                  Wenn Sie auf "Kostenlos Testen" klicken und auf die App zugreifen, kann die Benutzeroberfläche auf Englisch sein. Sie können sie einfach ins Deutsche (oder eine von über 130 Sprachen) übersetzen, indem Sie auf die Übersetzungsschaltfläche (Globus-Symbol 🌐) in der Kopfzeile oben auf der Seite klicken.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-16 px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold">Gehen Brillante Ideen Verloren?</h2>
            <p className="text-muted-foreground mt-4">
              Schnelle kreative Sitzungen erzeugen erstaunliche Konzepte, aber manuelle Notizen töten den Schwung und großartige Ideen gehen in verstreuten Notizen verloren.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Verlorene Kreative Ideen</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Während intensivem Brainstorming bemüht sich immer jemand, Notizen zu machen. Großartige Konzepte gehen verloren, weil niemand sie richtig erfasst hat.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Verstreute Dokumentation</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Kampagnenentscheidungen und kreative Ausrichtung landen in zufälligen Notizbüchern, unvollständigen Google-Docs oder schlimmer - nur in den Köpfen der Leute.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Sprachbarrieren</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Globale kreative Teams kämpfen, wenn Meetings mehrere Sprachen mischen, was es schwer macht, die Beiträge aller genau zu erfassen.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Für Kreativen Fluss Gebaut</h2>
            <p className="text-muted-foreground mt-2">
              Entwickelt für Marketing-Teams und kreative Profis, die schnell vorankommen müssen, ohne Ideen zu verlieren.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12 max-w-6xl mx-auto">
            {featureHighlights.map((feature, index) => (
              <div key={index} className="flex flex-col items-center text-center p-4">
                {feature.icon}
                <h3 className="text-xl font-semibold mt-4">{feature.title}</h3>
                <p className="text-muted-foreground mt-2">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Use Case Scenarios */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Perfekt Für Ihren Kreativen Workflow</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kampagnen-Brainstorming</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Erfassen Sie jedes Konzept, jeden Slogan und jede kreative Ausrichtung während der Kampagnen-Ideenfindung. Überprüfen Sie das vollständige Transkript, um die besten Ideen auszuwählen und umfassende Briefings zu erstellen.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Design-Kritiken</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Dokumentieren Sie alle Rückmeldungen aus Design-Reviews. Behalten Sie einen klaren Überblick darüber, was funktioniert hat, was nicht und die Begründung hinter kreativen Entscheidungen.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Kundenpräsentationen</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Nehmen Sie Kunden-Feedback-Sitzungen auf, um sicherzustellen, dass nichts übersehen wird. Haben Sie eine genaue Referenz für Überarbeitungen, Genehmigungen und Umfangsdiskussionen.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Content-Planung</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Verwandeln Sie Strategie-Meetings in durchsuchbare Content-Kalender. Fragen Sie sich nie wieder "wer hat dieses Thema vorgeschlagen?" oder "was war der Ansatz, den wir besprochen haben?"</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Fragen von Kreativen Teams</h2>
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
        <section className="py-20 px-4 text-center bg-purple-600 text-white">
          <h2 className="text-3xl font-bold">Bereit, Nie Wieder Eine Großartige Idee Zu Verlieren?</h2>
          <p className="mt-4 max-w-2xl mx-auto">
            Schließen Sie sich kreativen Teams weltweit an, die KI-Transkription nutzen, um ihre besten Ideen zu erfassen, zu organisieren und umzusetzen.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={handleStartTranscribing}>
              Jetzt Kostenlos Testen
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-purple-600" onClick={() => navigate("/pricing")}>
              Preise Ansehen
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
