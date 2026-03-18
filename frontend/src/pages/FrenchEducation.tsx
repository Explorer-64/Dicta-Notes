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
    title: "Accessibilité pour Tous les Étudiants",
    description: "Fournissez des transcriptions précises pour tous les cours, soutenant la conformité et rendant le contenu accessible à tous les étudiants, y compris ceux malentendants.",
  },
  {
    icon: <BookOpen className="h-8 w-8 text-green-500" />,
    title: "Transformez les Cours en Aides à l'Étude",
    description: "Les étudiants peuvent transformer les enregistrements de cours en texte consultable et citable, facilitant l'étude, la rédaction et la révision des concepts clés.",
  },
  {
    icon: <FileText className="h-8 w-8 text-yellow-500" />,
    title: "Capture Automatique des Cours",
    description: "Enregistrez n'importe quel cours, en présentiel ou en ligne, et laissez notre IA s'occuper de la prise de notes. Créez une archive permanente et précise de chaque leçon.",
  },
  {
    icon: <Globe className="h-8 w-8 text-purple-500" />,
    title: "Idéal pour les Étudiants Internationaux",
    description: "Support multilingue avec traduction en temps réel dans plus de 130 langues - parfait pour les universités internationales et les étudiants étrangers.",
  },
];

const faqItems = [
  {
    question: "Comment cela aide-t-il notre institution à répondre aux exigences d'accessibilité?",
    answer: "En fournissant des transcriptions précises et horodatées des cours et du matériel pédagogique, vous offrez une alternative équitable pour les étudiants malentendants et ayant d'autres besoins d'apprentissage."
  },
  {
    question: "Est-ce compliqué pour les professeurs?",
    answer: "Pas du tout. Le processus est simple : lancez l'enregistrement et nous nous occupons du reste. Cela nécessite un minimum de compétences techniques et permet aux enseignants de se concentrer sur l'enseignement."
  },
  {
    question: "Les étudiants peuvent-ils l'utiliser pour leurs groupes d'étude?",
    answer: "Absolument. Les étudiants peuvent utiliser Dicta-Notes pour enregistrer et transcrire les sessions d'étude, les projets de groupe et les discussions de révision, créant ainsi un référentiel partagé de connaissances."
  },
  {
    question: "Dans quels formats peut-on exporter les transcriptions?",
    answer: "Vous pouvez exporter les transcriptions en PDF, Word, texte brut et Markdown, ce qui facilite le partage, l'archivage et l'intégration dans votre système de gestion de l'apprentissage (LMS)."
  }
];

export default function FrenchEducation() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('French Education Page', { language: 'fr', niche: 'education' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'fr');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="fr" />
        <title>Dicta-Notes pour l'Éducation | Transcription de Cours par IA</title>
        <meta name="description" content="Solution de transcription par IA pour l'éducation. Transformez les cours et séminaires en notes consultables. Parfait pour les étudiants, professeurs et universités. Support multilingue pour étudiants internationaux." />
        <link rel="canonical" href="https://dicta-notes.com/french-education" />
        <meta name="robots" content="index, follow" />
        
        {/* Hreflang tags for education pages */}
        <link rel="alternate" hrefLang="fr" href="https://dicta-notes.com/french-education" />
        <link rel="alternate" hrefLang="es" href="https://dicta-notes.com/spanish-education" />
        <link rel="alternate" hrefLang="de" href="https://dicta-notes.com/german-education" />
        <link rel="alternate" hrefLang="el" href="https://dicta-notes.com/greek-education" />
        <link rel="alternate" hrefLang="ko" href="https://dicta-notes.com/korean-education" />
        <link rel="alternate" hrefLang="x-default" href="https://dicta-notes.com/education" />

        {/* Open Graph */}
        <meta property="og:title" content="Dicta-Notes pour l'Éducation | Transcription de Cours" />
        <meta property="og:description" content="Transcription par IA pour cours, séminaires et groupes d'étude. Accessible, multilingue, facile à utiliser." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/french-education" />
        <meta property="og:locale" content="fr_FR" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://dicta-notes.com/french-education#app",
            "url": "https://dicta-notes.com/french-education",
            "name": "Dicta-Notes pour l'Éducation",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web",
            "inLanguage": "fr",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Transcription de cours en temps réel par IA. Transformez les cours en notes consultables avec identification des interlocuteurs. Support de 130+ langues pour étudiants internationaux.",
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
            Donnez à Chaque Étudiant un Apprentissage Accessible
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Dicta-Notes transforme vos cours en transcriptions précises et consultables. Améliorez l'accessibilité, soutenez la conformité et donnez à vos étudiants des outils puissants pour réussir.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={handleStartTranscribing}>
              Commencer Gratuitement
            </Button>
          </div>
        </section>

        {/* Translate Feature Notice */}
        <section className="py-8 px-4 bg-blue-50 dark:bg-blue-950/20">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-start">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100">💡 Astuce : Traduire l'Application</p>
                <p className="text-blue-800 dark:text-blue-200 mt-1">
                  Lorsque vous cliquez sur "Commencer Gratuitement" et accédez à l'application, l'interface peut être en anglais. Vous pouvez facilement la traduire en français (ou toute autre langue parmi 130+ langues) en cliquant sur le bouton de traduction (icône globe 🌐) dans l'en-tête en haut de la page.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-16 px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold">Vos Étudiants Ont-ils du Mal à Suivre?</h2>
            <p className="text-muted-foreground mt-4">
              La prise de notes manuelle est inefficace et crée des obstacles pour les étudiants ayant des besoins d'apprentissage divers. Des informations précieuses sont perdues dès qu'un cours se termine.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Contenu Inaccessible</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Les cours basés sur l'écoute excluent les étudiants malentendants et ne répondent pas aux normes d'accessibilité modernes.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Étude Inefficace</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Les étudiants passent plus de temps à griffonner des notes qu'à s'engager avec le matériel, conduisant à un apprentissage passif et à des détails oubliés.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Manque de Matériel de Révision</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Une fois le cours terminé, il n'y a aucun moyen facile pour les étudiants de réviser un concept spécifique ou de clarifier un point qu'ils ont manqué.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Une Salle de Classe Plus Intelligente pour Tous</h2>
            <p className="text-muted-foreground mt-2">
              Conçu pour les éducateurs et les étudiants qui valorisent un apprentissage accessible et efficace.
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
            <h2 className="text-3xl font-bold text-center mb-8">Questions des Éducateurs</h2>
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
          <h2 className="text-3xl font-bold">Créez un Environnement d'Apprentissage Plus Inclusif Aujourd'hui</h2>
          <p className="mt-4 max-w-2xl mx-auto">
            Rejoignez les établissements leaders pour rendre l'éducation plus accessible et efficace. Commencez avec la transcription de cours par IA.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={handleStartTranscribing}>
              Démarrer un Essai Gratuit
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-indigo-600" onClick={() => navigate("/pricing")}>
              Voir les Plans
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
