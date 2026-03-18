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
    title: "Adoptez le Travail Asynchrone",
    description: "Remplacez les réunions de mise à jour par des transcriptions résumées et consultables. Gardez tout le monde informé, peu importe leur fuseau horaire.",
  },
  {
    icon: <Search className="h-8 w-8 text-green-500" />,
    title: "Une Mémoire d'Équipe Consultable",
    description: "Chaque conversation devient partie de la base de connaissances collective de votre équipe. Trouvez instantanément les décisions clés, les échéances et les éléments d'action.",
  },
  {
    icon: <Archive className="h-8 w-8 text-yellow-500" />,
    title: "Notes de Réunion Automatiques",
    description: "Obtenez des notes détaillées avec identification des intervenants, alimentées par Gemini 2.5 Pro. Concentrez-vous sur la conversation, pas sur la prise de notes.",
  },
];

const faqItems = [
  {
    question: "Comment cela aide-t-il à réduire la fatigue des réunions ?",
    answer: "En fournissant des transcriptions fiables et détaillées, vous pouvez sauter en toute confiance les réunions de mise à jour. Les membres de l'équipe peuvent se rattraper à leur propre rythme, conduisant à moins de sessions en direct, plus concentrées."
  },
  {
    question: "Peut-on intégrer ceci avec nos outils de gestion de projet ?",
    answer: "Bien que nous n'ayons pas encore d'intégrations directes, vous pouvez facilement exporter les transcriptions dans divers formats (Texte, Markdown, Word) pour copier-coller les éléments d'action et les résumés dans des outils comme Asana, Jira ou Trello."
  },
  {
    question: "Quelle est la différence entre la parole du navigateur et la transcription finale ?",
    answer: "Le texte en direct que vous voyez pendant l'enregistrement est pour le retour UX immédiat. La transcription finale hautement précise est traitée par Gemini 2.5 Pro à partir de l'audio enregistré pour une qualité et une fiabilité maximales."
  },
  {
    question: "Cela convient-il aux discussions internes confidentielles ?",
    answer: "Oui. Nous utilisons l'infrastructure sécurisée de Firebase pour garantir que vos données sont chiffrées et protégées. C'est une solution sécurisée pour la plupart des communications professionnelles, mais nous ne sommes pas conformes HIPAA."
  }
];

export default function RemoteTeamsFr() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Remote Teams FR Page', { language: 'fr', niche: 'remote-teams' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'fr');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="fr" />
        <title>Dicta-Notes pour Équipes Distantes | Transcription IA pour Teams Distribuées</title>
        <meta name="description" content="Transcription de réunions alimentée par l'IA pour les équipes distantes et distribuées. Réduisez la fatigue des réunions, permettez la collaboration asynchrone et créez une base de connaissances consultable à travers les fuseaux horaires." />
        <meta name="keywords" content="transcription équipe distante, réunions équipe distribuée, notes réunion asynchrones, collaboration fuseaux horaires, documentation travail distant, productivité équipe distribuée" />
        <link rel="canonical" href="https://dicta-notes.com/remote-teams-fr" />
        
        {/* Hreflang tags */}
        <link rel="alternate" hrefLang="en" href="https://dicta-notes.com/remote-teams" />
        <link rel="alternate" hrefLang="fr" href="https://dicta-notes.com/remote-teams-fr" />
        <link rel="alternate" hrefLang="es" href="https://dicta-notes.com/remote-teams-es" />
        <link rel="alternate" hrefLang="de" href="https://dicta-notes.com/remote-teams-de" />
        <link rel="alternate" hrefLang="el" href="https://dicta-notes.com/remote-teams-el" />
        <link rel="alternate" hrefLang="ko" href="https://dicta-notes.com/remote-teams-ko" />
        <link rel="alternate" hrefLang="x-default" href="https://dicta-notes.com/remote-teams" />

        {/* Open Graph */}
        <meta property="og:title" content="Dicta-Notes pour Équipes Distantes" />
        <meta property="og:description" content="Transcription de réunions IA pour équipes distribuées. Collaboration asynchrone à travers les fuseaux horaires avec notes automatiques." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/remote-teams-fr" />
        <meta property="og:locale" content="fr_FR" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes pour Équipes Distantes",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "fr",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Transcription de réunions alimentée par l'IA pour les équipes distantes et distribuées. Réduisez la fatigue des réunions, permettez la collaboration asynchrone et créez une documentation consultable à travers les fuseaux horaires avec identification des intervenants en 130+ langues.",
            "audience": {
              "@type": "BusinessAudience",
              "name": "Équipes Distantes et Distribuées"
            }
          })}
        </script>
      </Helmet>
      <Header />

      <div className="bg-background text-foreground">
        {/* Hero Section */}
        <section className="text-center py-20 px-4 bg-gray-50 dark:bg-gray-900">
          <h1 className="text-4xl md:text-5xl font-bold">
            Plus de Productivité, Moins de Réunions
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Dicta-Notes donne à votre équipe distante le pouvoir de la communication asynchrone avec des réunions transcrites par IA. Transformez chaque conversation en documentation actionnable et consultable.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={handleStartTranscribing}>
              Commencez Votre Essai Gratuit
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
                  Lorsque vous cliquez sur "Commencez Votre Essai Gratuit" et accédez à l'application, l'interface peut être en anglais. Vous pouvez facilement la traduire en français (ou dans l'une des 130+ langues) en cliquant sur le bouton de traduction (icône globe 🌐) dans l'en-tête en haut de la page.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-16 px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold">Votre Équipe Distribuée Se Noie dans les Réunions ?</h2>
            <p className="text-muted-foreground mt-4">
              La coordination entre fuseaux horaires conduit souvent à une surcharge de réunions, des silos d'information et des mises à jour de statut interminables qui tuent la productivité.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Fatigue des Réunions</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Les appels vidéo dos à dos ne laissent pas de temps pour le travail en profondeur. Les conversations importantes sont précipitées et les membres de l'équipe sont désengagés.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Silos d'Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Les décisions clés prises en réunion sont perdues dès la fin de l'appel, indisponibles pour ceux qui n'ont pas pu y assister.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Conflits de Fuseaux Horaires</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Les membres de l'équipe sont forcés d'accepter des appels tôt le matin ou tard le soir, conduisant à l'épuisement et à une participation inéquitable.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Travaillez Plus Intelligemment, Pas Plus Dur</h2>
            <p className="text-muted-foreground mt-2">
              Dicta-Notes est conçu pour l'équipe distante moderne, asynchrone d'abord.
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
            <h2 className="text-3xl font-bold text-center mb-8">Vos Questions, Nos Réponses</h2>
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
          <h2 className="text-3xl font-bold">Prêt à Récupérer le Temps de Votre Équipe ?</h2>
          <p className="mt-4 max-w-2xl mx-auto">
            Donnez à votre équipe distribuée les outils pour communiquer efficacement, peu importe où ou quand ils travaillent.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={handleStartTranscribing}>
              Commencez l'Essai Gratuit Maintenant
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-green-600" onClick={() => navigate("/pricing")}>
              Voir les Tarifs
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
