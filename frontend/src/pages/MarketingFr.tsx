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
    title: "Ne Perdez Jamais une Idée Créative",
    description: "Capturez chaque brainstorming, chaque étincelle de créativité. Notre IA transcrit vos sessions pour que les idées brillantes ne vous échappent jamais.",
  },
  {
    icon: <Users className="h-8 w-8 text-green-500" />,
    title: "Collaboration d'Équipe Multilingue",
    description: "Travaillez en toute transparence avec des équipes créatives de différentes langues. Transcription en temps réel dans plus de 130 langues pour une vraie collaboration mondiale.",
  },
  {
    icon: <FileText className="h-8 w-8 text-yellow-500" />,
    title: "Documentation Automatisée des Réunions",
    description: "Concentrez-vous sur le flux créatif pendant que nous gérons les notes. Obtenez des transcriptions avec identification des interlocuteurs pour chaque revue de campagne et session d'idéation.",
  },
  {
    icon: <Globe className="h-8 w-8 text-purple-500" />,
    title: "Archive Créative Consultable",
    description: "Créez une base de connaissances de décisions créatives. Recherchez facilement dans les brainstormings passés pour retrouver ce concept parfait discuté il y a des mois.",
  },
];

const faqItems = [
  {
    question: "Comment cela aide-t-il lors des sessions de brainstorming créatif?",
    answer: "Pendant le brainstorming, les idées fusent rapidement. Dicta-Notes capture automatiquement chaque suggestion et concept, permettant à votre équipe de rester dans le flux créatif sans se soucier de la prise de notes. Consultez la transcription complète plus tard pour identifier les meilleures idées."
  },
  {
    question: "Peut-on l'utiliser pour les présentations clients et sessions de feedback?",
    answer: "Absolument ! Enregistrez les réunions clients, critiques de design et sessions de feedback. Vous aurez un compte rendu précis des demandes clients, de la direction créative et des décisions d'approbation - parfait pour référence et responsabilisation."
  },
  {
    question: "Qu'en est-il des équipes multilingues?",
    answer: "Dicta-Notes supporte plus de 130 langues avec identification des interlocuteurs. Si votre équipe créative s'étend sur plusieurs pays, chacun peut participer dans sa langue préférée, et la transcription capture tout."
  },
  {
    question: "Quelle est la sécurité de notre contenu créatif?",
    answer: "Toutes les transcriptions sont chiffrées et stockées de manière sécurisée via l'infrastructure Firebase. Vos concepts créatifs, idées de campagne et discussions clients restent confidentiels et protégés."
  }
];

export default function MarketingFr() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Marketing FR Page', { language: 'fr', niche: 'marketing' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'fr');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="fr" />
        <title>Dicta-Notes pour Équipes Marketing | Transcription IA pour Créatifs</title>
        <meta name="description" content="Transcription IA pour équipes marketing et créatives. Ne perdez jamais une idée brillante de vos sessions de brainstorming. Parfait pour planification de campagnes, revues de design et collaboration multilingue." />
        <meta name="keywords" content="transcription marketing, réunions équipe créative, documentation brainstorming, notes planification campagne, transcription revue design, équipes marketing multilingues" />
        <link rel="canonical" href="https://dicta-notes.com/marketing-fr" />
        
        {/* Hreflang tags for marketing pages */}
        <link rel="alternate" hrefLang="en" href="https://dicta-notes.com/marketing" />
        <link rel="alternate" hrefLang="fr" href="https://dicta-notes.com/marketing-fr" />
        <link rel="alternate" hrefLang="es" href="https://dicta-notes.com/marketing-es" />
        <link rel="alternate" hrefLang="de" href="https://dicta-notes.com/marketing-de" />
        <link rel="alternate" hrefLang="el" href="https://dicta-notes.com/marketing-el" />
        <link rel="alternate" hrefLang="ko" href="https://dicta-notes.com/marketing-ko" />
        <link rel="alternate" hrefLang="x-default" href="https://dicta-notes.com/marketing" />

        {/* Open Graph */}
        <meta property="og:title" content="Dicta-Notes pour Équipes Marketing & Créatives" />
        <meta property="og:description" content="Transcription IA pour brainstorming, planification de campagnes et revues créatives. Ne perdez plus jamais une grande idée." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/marketing-fr" />
        <meta property="og:locale" content="fr_FR" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes pour Équipes Marketing",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "fr",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Transcription de réunions par IA pour équipes marketing et créatives. Capturez sessions de brainstorming, planification de campagnes et revues de design avec identification des interlocuteurs dans plus de 130 langues.",
            "audience": {
              "@type": "BusinessAudience",
              "name": "Professionnels Marketing et Créatifs"
            }
          })}
        </script>
      </Helmet>
      <Header />

      <div className="bg-background text-foreground">
        {/* Hero Section */}
        <section className="text-center py-20 px-4 bg-gray-50 dark:bg-gray-900">
          <h1 className="text-4xl md:text-5xl font-bold">
            Capturez Chaque Étincelle Créative
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Dicta-Notes transforme vos sessions de brainstorming et réunions créatives en documentation consultable et actionnable. Concentrez-vous sur l'innovation pendant que l'IA gère les notes.
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
            <h2 className="text-3xl font-bold">Les Idées Brillantes S'échappent-elles?</h2>
            <p className="text-muted-foreground mt-4">
              Les sessions créatives rapides génèrent des concepts extraordinaires, mais la prise de notes manuelle tue l'élan et les grandes idées se perdent dans des notes éparses.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Idées Créatives Perdues</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Pendant un brainstorming intense, quelqu'un se démène toujours pour prendre des notes. Les grands concepts disparaissent car personne ne les a capturés correctement.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Documentation Éparpillée</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Les décisions de campagne et la direction créative finissent dans des carnets aléatoires, des Google docs incomplets ou pire - juste dans la mémoire des gens.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Barrières Linguistiques</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Les équipes créatives mondiales peinent quand les réunions mélangent plusieurs langues, rendant difficile la capture précise des contributions de chacun.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Conçu pour le Flux Créatif</h2>
            <p className="text-muted-foreground mt-2">
              Pensé pour les équipes marketing et créatifs qui doivent avancer vite sans perdre d'idées.
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
            <h2 className="text-3xl font-bold text-center mb-12">Parfait Pour Votre Flux de Travail Créatif</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Brainstorming de Campagne</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Capturez chaque concept, slogan et direction créative pendant l'idéation de campagne. Consultez la transcription complète pour sélectionner les meilleures idées et créer des briefs complets.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Critiques de Design</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Documentez tous les retours des revues de design. Gardez un compte rendu clair de ce qui a marché, ce qui n'a pas marché, et le raisonnement derrière les décisions créatives.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Présentations Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Enregistrez les sessions de feedback client pour ne rien manquer. Ayez une référence précise pour les révisions, approbations et discussions de périmètre.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Planification de Contenu</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Transformez les réunions stratégiques en calendriers de contenu consultables. Ne vous demandez plus jamais "qui a suggéré ce sujet?" ou "quel était l'angle qu'on a discuté?"</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Questions des Équipes Créatives</h2>
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
          <h2 className="text-3xl font-bold">Prêt à Ne Plus Jamais Perdre une Grande Idée?</h2>
          <p className="mt-4 max-w-2xl mx-auto">
            Rejoignez les équipes créatives du monde entier qui utilisent la transcription IA pour capturer, organiser et agir sur leurs meilleures idées.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={handleStartTranscribing}>
              Démarrer Gratuitement
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-purple-600" onClick={() => navigate("/pricing")}>
              Voir les Tarifs
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
