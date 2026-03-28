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
    title: "Adopta el Trabajo Asíncrono",
    description: "Reemplaza las reuniones de actualización de estado con transcripciones resumidas y buscables. Mantén a todos informados, sin importar su zona horaria.",
  },
  {
    icon: <Search className="h-8 w-8 text-green-500" />,
    title: "Una Memoria de Equipo Buscable",
    description: "Cada conversación se convierte en parte de la base de conocimientos colectiva de tu equipo. Encuentra instantáneamente decisiones clave, plazos y elementos de acción.",
  },
  {
    icon: <Archive className="h-8 w-8 text-yellow-500" />,
    title: "Notas de Reunión Automáticas",
    description: "Obtén notas detalladas con identificación de interlocutores, impulsadas por Google Gemini 2.5. Concéntrate en la conversación, no en tomar notas.",
  },
];

const faqItems = [
  {
    question: "¿Cómo ayuda esto a reducir la fatiga de las reuniones?",
    answer: "Al proporcionar transcripciones confiables y detalladas, puedes omitir con confianza las reuniones de actualización de estado. Los miembros del equipo pueden ponerse al día en su propio tiempo, lo que conduce a menos sesiones en vivo más enfocadas."
  },
  {
    question: "¿Podemos integrar esto con nuestras herramientas de gestión de proyectos?",
    answer: "Aunque aún no tenemos integraciones directas, puedes exportar fácilmente las transcripciones en varios formatos (Texto, Markdown, Word) para copiar y pegar elementos de acción y resúmenes en herramientas como Asana, Jira o Trello."
  },
  {
    question: "¿Cuál es la diferencia entre el habla del navegador y la transcripción final?",
    answer: "El texto en vivo que ves durante la grabación es para retroalimentación UX inmediata. La transcripción final altamente precisa es procesada por Google Gemini 2.5 del audio guardado para máxima calidad y confiabilidad."
  },
  {
    question: "¿Es esto adecuado para discusiones internas confidenciales?",
    answer: "Sí. Usamos la infraestructura segura de Firebase para garantizar que tus datos estén encriptados y protegidos. Es una solución segura para la mayoría de las comunicaciones comerciales, pero no cumplimos con HIPAA."
  }
];

export default function RemoteTeamsEs() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Remote Teams ES Page', { language: 'es', niche: 'remote-teams' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'es');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="es" />
        <title>Dicta-Notes para Equipos Remotos | Transcripción IA para Equipos Distribuidos</title>
        <meta name="description" content="Transcripción de reuniones con IA para equipos remotos y distribuidos. Reduce la fatiga de reuniones, habilita colaboración asíncrona y construye una base de conocimientos buscable entre zonas horarias." />
        <meta name="keywords" content="transcripción equipo remoto, reuniones equipo distribuido, notas reunión asíncronas, colaboración zonas horarias, documentación trabajo remoto, productividad equipo distribuido" />
        <link rel="canonical" href="https://dicta-notes.com/remote-teams-es" />
        
        {/* Hreflang tags */}
        <link rel="alternate" hrefLang="en" href="https://dicta-notes.com/remote-teams" />
        <link rel="alternate" hrefLang="fr" href="https://dicta-notes.com/remote-teams-fr" />
        <link rel="alternate" hrefLang="es" href="https://dicta-notes.com/remote-teams-es" />
        <link rel="alternate" hrefLang="de" href="https://dicta-notes.com/remote-teams-de" />
        <link rel="alternate" hrefLang="el" href="https://dicta-notes.com/remote-teams-el" />
        <link rel="alternate" hrefLang="ko" href="https://dicta-notes.com/remote-teams-ko" />
        <link rel="alternate" hrefLang="x-default" href="https://dicta-notes.com/remote-teams" />

        {/* Open Graph */}
        <meta property="og:title" content="Dicta-Notes para Equipos Remotos" />
        <meta property="og:description" content="Transcripción de reuniones IA para equipos distribuidos. Habilita colaboración asíncrona entre zonas horarias con notas automáticas." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/remote-teams-es" />
        <meta property="og:locale" content="es_ES" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes para Equipos Remotos",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "es",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Transcripción de reuniones con IA para equipos remotos y distribuidos. Reduce la fatiga de reuniones, habilita colaboración asíncrona y construye documentación buscable entre zonas horarias con identificación de interlocutores en 130+ idiomas.",
            "audience": {
              "@type": "BusinessAudience",
              "name": "Equipos Remotos y Distribuidos"
            }
          })}
        </script>
      </Helmet>
      <Header />

      <div className="bg-background text-foreground">
        {/* Hero Section */}
        <section className="text-center py-20 px-4 bg-gray-50 dark:bg-gray-900">
          <h1 className="text-4xl md:text-5xl font-bold">
            Más Productividad, Menos Reuniones
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Dicta-Notes da a tu equipo remoto el poder de la comunicación asíncrona con reuniones transcritas por IA. Convierte cada conversación en documentación accionable y buscable.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={handleStartTranscribing}>
              Comienza Tu Prueba Gratuita
            </Button>
          </div>
        </section>

        {/* Translate Feature Notice */}
        <section className="py-8 px-4 bg-blue-50 dark:bg-blue-950/20">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-start">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100">💡 Consejo: Traduce la Aplicación</p>
                <p className="text-blue-800 dark:text-blue-200 mt-1">
                  Cuando hagas clic en "Comienza Tu Prueba Gratuita" y accedas a la aplicación, la interfaz puede estar en inglés. Puedes traducirla fácilmente al español (o a cualquiera de los 130+ idiomas) haciendo clic en el botón de traducción (icono de globo 🌐) en el encabezado en la parte superior de la página.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-16 px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold">¿Tu Equipo Distribuido Se Ahoga en Reuniones?</h2>
            <p className="text-muted-foreground mt-4">
              Coordinar entre zonas horarias a menudo conduce a sobrecarga de reuniones, silos de información y actualizaciones de estado interminables que matan la productividad.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Fatiga de Reuniones</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Las videollamadas consecutivas no dejan tiempo para trabajo profundo. Las conversaciones importantes se apresuran y los miembros del equipo están desconectados.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Silos de Información</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Las decisiones clave tomadas en reuniones se pierden tan pronto como termina la llamada, no disponibles para quienes no pudieron asistir.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Conflictos de Zona Horaria</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Los miembros del equipo se ven obligados a llamadas temprano en la mañana o tarde en la noche, lo que lleva al agotamiento y participación desigual.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Trabaja Más Inteligente, No Más Duro</h2>
            <p className="text-muted-foreground mt-2">
              Dicta-Notes está diseñado para el equipo remoto moderno, asíncrono primero.
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
            <h2 className="text-3xl font-bold text-center mb-8">Tus Preguntas, Respondidas</h2>
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
          <h2 className="text-3xl font-bold">¿Listo para Recuperar el Tiempo de Tu Equipo?</h2>
          <p className="mt-4 max-w-2xl mx-auto">
            Empodera a tu equipo distribuido con las herramientas para comunicarse efectivamente, sin importar dónde o cuándo trabajen.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={handleStartTranscribing}>
              Comienza Prueba Gratuita Ahora
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-green-600" onClick={() => navigate("/pricing")}>
              Ver Precios
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
