import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Accessibility, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";

const featureHighlights = [
  {
    icon: <Accessibility className="h-8 w-8 text-blue-500" />,
    title: "Barrierefreiheit für Alle Studierenden",
    description: "Bieten Sie präzise Transkripte für alle Vorlesungen und unterstützen Sie die Einhaltung von Vorschriften, während Sie Inhalte für alle Studierenden zugänglich machen, einschließlich Menschen mit Hörbehinderungen.",
  },
  {
    icon: <BookOpen className="h-8 w-8 text-green-500" />,
    title: "Verwandeln Sie Vorlesungen in Lernhilfen",
    description: "Studierende können lange Vorlesungsaufzeichnungen in durchsuchbaren und zitierbaren Text umwandeln, was das Lernen, Schreiben von Arbeiten und die Wiederholung von Schlüsselkonzepten erleichtert.",
  },
  {
    icon: <FileText className="h-8 w-8 text-yellow-500" />,
    title: "Automatische Vorlesungsaufzeichnung",
    description: "Nehmen Sie jede Unterrichtsstunde auf, ob persönlich oder online, und lassen Sie unsere KI die Notizen übernehmen. Erstellen Sie ein permanentes, genaues Archiv jeder Lektion.",
  },
  {
    icon: <Globe className="h-8 w-8 text-purple-500" />,
    title: "Ideal für Internationale Studierende",
    description: "Mehrsprachige Unterstützung mit Echtzeit-Übersetzung in über 130 Sprachen - perfekt für internationale Universitäten und ausländische Studierende.",
  },
];

const faqItems = [
  {
    question: "Wie hilft dies unserer Einrichtung, die Anforderungen an Barrierefreiheit zu erfüllen?",
    answer: "Durch die Bereitstellung präziser, zeitgestempelter Transkripte von Vorlesungen und Kursmaterialien bieten Sie eine gleichberechtigte Alternative für Studierende mit Hörbehinderungen und anderen Lernbedürfnissen."
  },
  {
    question: "Ist es kompliziert für Professoren zu nutzen?",
    answer: "Überhaupt nicht. Der Prozess ist einfach: Starten Sie die Aufnahme, und wir kümmern uns um den Rest. Es erfordert minimale technische Fähigkeiten und ermöglicht es Dozenten, sich auf das Lehren zu konzentrieren, nicht auf Technologie."
  },
  {
    question: "Können Studierende dies für ihre eigenen Lerngruppen verwenden?",
    answer: "Auf jeden Fall. Studierende können Dicta-Notes verwenden, um Lernsitzungen, Gruppenprojekte und Wiederholungsdiskussionen aufzuzeichnen und zu transkribieren und so ein gemeinsames Wissensarchiv zu erstellen."
  },
  {
    question: "In welchen Formaten können wir die Transkripte exportieren?",
    answer: "Sie können Transkripte als PDF, Word, Klartext und Markdown exportieren, was das Teilen, Archivieren und die Integration in Ihr Lernmanagementsystem (LMS) erleichtert."
  }
];

export default function GermanEducation() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('German Education Page', { language: 'de', niche: 'education' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'de');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="de" />
        <title>Dicta-Notes für Bildung | KI-Vorlesungstranskription</title>
        <meta name="description" content="KI-Transkriptionslösung für Bildung. Verwandeln Sie Vorlesungen und Seminare in durchsuchbare Notizen. Perfekt für Studenten, Professoren und Universitäten. Mehrsprachige Unterstützung für internationale Studenten." />
        <link rel="canonical" href="https://dicta-notes.com/german-education" />
        <meta name="robots" content="index, follow" />
        
        {/* Hreflang tags for education pages */}
        <link rel="alternate" hrefLang="de" href="https://dicta-notes.com/german-education" />
        <link rel="alternate" hrefLang="fr" href="https://dicta-notes.com/french-education" />
        <link rel="alternate" hrefLang="es" href="https://dicta-notes.com/spanish-education" />
        <link rel="alternate" hrefLang="el" href="https://dicta-notes.com/greek-education" />
        <link rel="alternate" hrefLang="ko" href="https://dicta-notes.com/korean-education" />
        <link rel="alternate" hrefLang="x-default" href="https://dicta-notes.com/education" />

        {/* Open Graph */}
        <meta property="og:title" content="Dicta-Notes für Bildung | Vorlesungstranskription" />
        <meta property="og:description" content="KI-Transkription für Vorlesungen, Seminare und Lerngruppen. Barrierefrei, mehrsprachig, einfach zu bedienen." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/german-education" />
        <meta property="og:locale" content="de_DE" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://dicta-notes.com/german-education#app",
            "url": "https://dicta-notes.com/german-education",
            "name": "Dicta-Notes für Bildung",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web",
            "inLanguage": "de",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Echtzeit-Transkription von Vorlesungen per KI. Verwandeln Sie Vorlesungen in durchsuchbare Notizen mit Sprechererkennung. Unterstützung von 130+ Sprachen für internationale Studierende.",
            "audience": {
              "@type": "EducationalAudience",
              "educationalRole": "student"
            }
          })}
        </script>
      </Helmet>
      <Header />

      <div className="bg-background text-foreground">
        {/* Hero Section */}
        <section className="text-center py-20 px-4 bg-gray-50 dark:bg-gray-900">
          <h1 className="text-4xl md:text-5xl font-bold">
            Geben Sie Jedem Studierenden Zugängliches Lernen
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Dicta-Notes verwandelt Ihre Vorlesungen in präzise, durchsuchbare Transkripte. Verbessern Sie die Barrierefreiheit, unterstützen Sie Compliance und geben Sie Ihren Studierenden leistungsstarke Werkzeuge zum Erfolg.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={handleStartTranscribing}>
              Jetzt Kostenlos Starten
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
                  Wenn Sie auf "Jetzt Kostenlos Starten" klicken und zur App gelangen, kann die Oberfläche auf Englisch sein. Sie können sie einfach auf Deutsch (oder eine andere von 130+ Sprachen) übersetzen, indem Sie auf die Übersetzen-Schaltfläche (Globus-Icon 🌐) in der Kopfzeile oben auf der Seite klicken.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-16 px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold">Haben Ihre Studierenden Schwierigkeiten, Mitzukommen?</h2>
            <p className="text-muted-foreground mt-4">
              Manuelle Notizen sind ineffizient und schaffen Hürden für Studierende mit unterschiedlichen Lernbedürfnissen. Wertvolle Informationen gehen verloren, sobald eine Vorlesung endet.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Nicht Zugängliche Inhalte</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Vorlesungen, die auf Zuhören basieren, schließen hörgeschädigte Studierende aus und entsprechen nicht modernen Barrierefreiheitsstandards.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Ineffizientes Lernen</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Studierende verbringen mehr Zeit mit dem Mitschreiben als mit der Auseinandersetzung mit dem Stoff, was zu passivem Lernen und vergessenen Details führt.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Mangel an Wiederholungsmaterial</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Nach Ende der Vorlesung gibt es keine einfache Möglichkeit für Studierende, ein bestimmtes Konzept zu wiederholen oder einen verpassten Punkt zu klären.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Ein Klügeres Klassenzimmer für Alle</h2>
            <p className="text-muted-foreground mt-2">
              Entworfen für Lehrende und Studierende, die zugängliches und effektives Lernen schätzen.
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
        
        {/* FAQ Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Fragen von Lehrenden</h2>
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
        <section className="py-20 px-4 text-center bg-indigo-600 text-white">
          <h2 className="text-3xl font-bold">Schaffen Sie Heute eine Inklusivere Lernumgebung</h2>
          <p className="mt-4 max-w-2xl mx-auto">
            Schließen Sie sich führenden Institutionen an, um Bildung zugänglicher und effektiver zu gestalten. Beginnen Sie mit KI-gestützter Vorlesungstranskription.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={handleStartTranscribing}>
              Kostenlose Testversion Starten
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-indigo-600" onClick={() => navigate("/pricing")}>
              Pläne Ansehen
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
