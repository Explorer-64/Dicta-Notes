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
    title: "Nunca Pierdas una Idea Creativa",
    description: "Captura cada lluvia de ideas, cada chispa de creatividad. Nuestra IA transcribe tus sesiones para que las ideas brillantes nunca se escapen.",
  },
  {
    icon: <Users className="h-8 w-8 text-green-500" />,
    title: "Colaboración Multilingüe de Equipos",
    description: "Trabaja sin problemas con equipos creativos en diferentes idiomas. Transcripción en tiempo real compatible con más de 130 idiomas para una verdadera colaboración global.",
  },
  {
    icon: <FileText className="h-8 w-8 text-yellow-500" />,
    title: "Documentación Automatizada de Reuniones",
    description: "Concéntrate en el flujo creativo mientras nosotros nos encargamos de las notas. Obtén transcripciones con identificación de oradores para cada revisión de campaña y sesión de ideación.",
  },
  {
    icon: <Globe className="h-8 w-8 text-purple-500" />,
    title: "Archivo Creativo Buscable",
    description: "Construye una base de conocimiento de decisiones creativas. Busca fácilmente en lluvias de ideas pasadas para encontrar ese concepto perfecto que discutiste hace meses.",
  },
];

const faqItems = [
  {
    question: "¿Cómo ayuda esto con las sesiones de lluvia de ideas creativas?",
    answer: "Durante la lluvia de ideas, las ideas fluyen rápido. Dicta-Notes captura automáticamente cada sugerencia y concepto, permitiendo que tu equipo se mantenga en el flujo creativo sin preocuparse por tomar notas. Revisa la transcripción completa más tarde para identificar las mejores ideas."
  },
  {
    question: "¿Podemos usarlo para presentaciones a clientes y sesiones de retroalimentación?",
    answer: "¡Absolutamente! Graba reuniones con clientes, críticas de diseño y sesiones de retroalimentación. Tendrás un registro preciso de solicitudes de clientes, dirección creativa y decisiones de aprobación - perfecto para referencia y responsabilidad."
  },
  {
    question: "¿Qué pasa con los equipos multilingües?",
    answer: "Dicta-Notes soporta más de 130 idiomas con identificación de oradores. Si tu equipo creativo abarca múltiples países, todos pueden participar en su idioma preferido, y la transcripción captura todo."
  },
  {
    question: "¿Qué tan seguro está nuestro contenido creativo?",
    answer: "Todas las transcripciones están encriptadas y almacenadas de forma segura utilizando la infraestructura de Firebase. Tus conceptos creativos, ideas de campañas y discusiones con clientes permanecen confidenciales y protegidos."
  }
];

export default function MarketingEs() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Marketing ES Page', { language: 'es', niche: 'marketing' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'es');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="es" />
        <title>Dicta-Notes para Equipos de Marketing | Transcripción IA para Creativos</title>
        <meta name="description" content="Transcripción impulsada por IA para equipos de marketing y profesionales creativos. Nunca pierdas una idea brillante de sesiones de lluvia de ideas. Perfecto para planificación de campañas, revisiones de diseño y colaboración multilingüe." />
        <meta name="keywords" content="transcripción marketing, reuniones equipo creativo, documentación lluvia de ideas, notas planificación campaña, transcripción revisión diseño, equipos marketing multilingües" />
        <link rel="canonical" href="https://dicta-notes.com/marketing-es" />
        
        {/* Hreflang tags for marketing pages */}
        <link rel="alternate" hrefLang="en" href="https://dicta-notes.com/marketing" />
        <link rel="alternate" hrefLang="fr" href="https://dicta-notes.com/marketing-fr" />
        <link rel="alternate" hrefLang="es" href="https://dicta-notes.com/marketing-es" />
        <link rel="alternate" hrefLang="de" href="https://dicta-notes.com/marketing-de" />
        <link rel="alternate" hrefLang="el" href="https://dicta-notes.com/marketing-el" />
        <link rel="alternate" hrefLang="ko" href="https://dicta-notes.com/marketing-ko" />
        <link rel="alternate" hrefLang="x-default" href="https://dicta-notes.com/marketing" />

        {/* Open Graph */}
        <meta property="og:title" content="Dicta-Notes para Equipos de Marketing y Creativos" />
        <meta property="og:description" content="Transcripción IA para lluvia de ideas, planificación de campañas y revisiones creativas. Nunca pierdas otra gran idea." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/marketing-es" />
        <meta property="og:locale" content="es_ES" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes para Equipos de Marketing",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "es",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Transcripción de reuniones impulsada por IA para equipos de marketing y creativos. Captura sesiones de lluvia de ideas, planificación de campañas y revisiones de diseño con identificación de oradores en más de 130 idiomas.",
            "audience": {
              "@type": "BusinessAudience",
              "name": "Profesionales de Marketing y Creativos"
            }
          })}
        </script>
      </Helmet>
      <Header />

      <div className="bg-background text-foreground">
        {/* Hero Section */}
        <section className="text-center py-20 px-4 bg-gray-50 dark:bg-gray-900">
          <h1 className="text-4xl md:text-5xl font-bold">
            Captura Cada Chispa Creativa
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Dicta-Notes transforma tus sesiones de lluvia de ideas y reuniones creativas en documentación buscable y accionable. Concéntrate en la innovación mientras la IA se encarga de las notas.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={handleStartTranscribing}>
              Comenzar Prueba Gratis
            </Button>
          </div>
        </section>

        {/* Translate Feature Notice */}
        <section className="py-8 px-4 bg-blue-50 dark:bg-blue-950/20">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-start">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100">💡 Consejo: Traducir la Aplicación</p>
                <p className="text-blue-800 dark:text-blue-200 mt-1">
                  Cuando hagas clic en "Comenzar Prueba Gratis" y accedas a la aplicación, la interfaz puede estar en inglés. Puedes traducirla fácilmente al español (o cualquiera de más de 130 idiomas) haciendo clic en el botón de traducción (icono de globo 🌐) en el encabezado en la parte superior de la página.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-16 px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold">¿Se Están Escapando las Ideas Brillantes?</h2>
            <p className="text-muted-foreground mt-4">
              Las sesiones creativas de ritmo rápido generan conceptos increíbles, pero tomar notas manualmente mata el impulso y las grandes ideas se pierden en notas dispersas.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Ideas Creativas Perdidas</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Durante una lluvia de ideas intensa, siempre hay alguien luchando por tomar notas. Los grandes conceptos se pierden porque nadie los capturó correctamente.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Documentación Dispersa</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Las decisiones de campaña y la dirección creativa terminan en cuadernos al azar, documentos de Google incompletos o peor - solo en la memoria de las personas.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Barreras de Idioma</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Los equipos creativos globales luchan cuando las reuniones mezclan múltiples idiomas, dificultando capturar con precisión las contribuciones de todos.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Diseñado para el Flujo Creativo</h2>
            <p className="text-muted-foreground mt-2">
              Pensado para equipos de marketing y profesionales creativos que necesitan avanzar rápido sin perder ideas.
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
            <h2 className="text-3xl font-bold text-center mb-12">Perfecto Para Tu Flujo de Trabajo Creativo</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lluvia de Ideas de Campaña</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Captura cada concepto, eslogan y dirección creativa durante la ideación de campañas. Revisa la transcripción completa para seleccionar las mejores ideas y construir briefs completos.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Críticas de Diseño</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Documenta toda la retroalimentación de las revisiones de diseño. Mantén un registro claro de qué funcionó, qué no y el razonamiento detrás de las decisiones creativas.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Presentaciones a Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Graba sesiones de retroalimentación de clientes para asegurar que nada se pierda. Ten una referencia precisa para revisiones, aprobaciones y discusiones de alcance.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Planificación de Contenido</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Convierte reuniones estratégicas en calendarios de contenido buscables. Nunca más te preguntes "¿quién sugirió ese tema?" o "¿cuál era el enfoque que discutimos?"</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Preguntas de Equipos Creativos</h2>
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
          <h2 className="text-3xl font-bold">¿Listo Para Nunca Perder Otra Gran Idea?</h2>
          <p className="mt-4 max-w-2xl mx-auto">
            Únete a equipos creativos de todo el mundo que usan transcripción IA para capturar, organizar y actuar sobre sus mejores ideas.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={handleStartTranscribing}>
              Comenzar Prueba Gratis Ahora
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-purple-600" onClick={() => navigate("/pricing")}>
              Ver Precios
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
