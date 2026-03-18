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
    title: "Accesibilidad para Todos los Estudiantes",
    description: "Proporcione transcripciones precisas para todas las conferencias, apoyando el cumplimiento y haciendo que el contenido sea accesible para todos los estudiantes, incluidos aquellos con discapacidades auditivas.",
  },
  {
    icon: <BookOpen className="h-8 w-8 text-green-500" />,
    title: "Convierta Clases en Ayudas de Estudio",
    description: "Los estudiantes pueden transformar grabaciones de conferencias largas en texto buscable y citable, facilitando el estudio, la redacción de trabajos y la revisión de conceptos clave.",
  },
  {
    icon: <FileText className="h-8 w-8 text-yellow-500" />,
    title: "Captura Automática de Conferencias",
    description: "Grabe cualquier clase, ya sea presencial o en línea, y deje que nuestra IA se encargue de tomar notas. Cree un archivo permanente y preciso de cada lección.",
  },
  {
    icon: <Globe className="h-8 w-8 text-purple-500" />,
    title: "Ideal para Estudiantes Internacionales",
    description: "Soporte multilingüe con traducción en tiempo real a más de 130 idiomas - perfecto para universidades internacionales y estudiantes extranjeros.",
  },
];

const faqItems = [
  {
    question: "¿Cómo ayuda esto a nuestra institución a cumplir con los requisitos de accesibilidad?",
    answer: "Al proporcionar transcripciones precisas y con marca de tiempo de conferencias y materiales del curso, ofrece una alternativa equitativa para estudiantes con discapacidades auditivas y otras necesidades de aprendizaje."
  },
  {
    question: "¿Es complicado para los profesores usar?",
    answer: "Para nada. El proceso es simple: comience a grabar y nosotros nos encargamos del resto. Requiere habilidades técnicas mínimas y permite a los instructores centrarse en enseñar, no en la tecnología."
  },
  {
    question: "¿Pueden los estudiantes usar esto para sus grupos de estudio?",
    answer: "Absolutamente. Los estudiantes pueden usar Dicta-Notes para grabar y transcribir sesiones de estudio, proyectos grupales y discusiones de revisión, creando un repositorio compartido de conocimiento."
  },
  {
    question: "¿En qué formatos podemos exportar las transcripciones?",
    answer: "Puede exportar transcripciones como PDF, Word, texto plano y Markdown, lo que facilita compartir, archivar e integrar en su Sistema de Gestión del Aprendizaje (LMS)."
  }
];

export default function SpanishEducation() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Spanish Education Page', { language: 'es', niche: 'education' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'es');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="es" />
        <title>Dicta-Notes para Educación | Transcripción de Clases con IA</title>
        <meta name="description" content="Solución de transcripción con IA para educación. Convierte clases y seminarios en notas buscables. Perfecto para estudiantes, profesores y universidades. Soporte multilingüe para estudiantes internacionales." />
        <link rel="canonical" href="https://dicta-notes.com/spanish-education" />
        {/* FIRST_EDIT: ensure indexing allowed */}
        <meta name="robots" content="index, follow" />
        
        {/* Hreflang tags for education pages */}
        <link rel="alternate" hrefLang="es" href="https://dicta-notes.com/spanish-education" />
        <link rel="alternate" hrefLang="fr" href="https://dicta-notes.com/french-education" />
        <link rel="alternate" hrefLang="de" href="https://dicta-notes.com/german-education" />
        <link rel="alternate" hrefLang="el" href="https://dicta-notes.com/greek-education" />
        <link rel="alternate" hrefLang="ko" href="https://dicta-notes.com/korean-education" />
        <link rel="alternate" hrefLang="x-default" href="https://dicta-notes.com/education" />

        {/* Open Graph */}
        <meta property="og:title" content="Dicta-Notes para Educación | Transcripción de Clases" />
        <meta property="og:description" content="Transcripción con IA para clases, seminarios y grupos de estudio. Accesible, multilingüe, fácil de usar." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/spanish-education" />
        <meta property="og:locale" content="es_ES" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes para Educación",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web",
            "inLanguage": "es",
            "url": "https://dicta-notes.com/spanish-education",
            "@id": "https://dicta-notes.com/spanish-education",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Transcripción de clases en tiempo real con IA. Convierte clases en notas buscables con identificación de hablantes. Soporte de 130+ idiomas para estudiantes internacionales.",
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
            Empodere a Cada Estudiante con Aprendizaje Accesible
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Dicta-Notes transforma sus conferencias en transcripciones precisas y buscables. Mejore la accesibilidad, apoye el cumplimiento y brinde a sus estudiantes herramientas poderosas para tener éxito.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={handleStartTranscribing}>
              Comenzar Gratis
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
                  Cuando haga clic en "Comenzar Gratis" y acceda a la aplicación, la interfaz puede estar en inglés. Puede traducirla fácilmente al español (o cualquier otro de más de 130 idiomas) haciendo clic en el botón de traducción (icono de globo 🌐) en el encabezado en la parte superior de la página.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-16 px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold">¿Sus Estudiantes Tienen Dificultades para Seguir el Ritmo?</h2>
            <p className="text-muted-foreground mt-4">
              La toma de notas manual es ineficiente y crea barreras para estudiantes con diversas necesidades de aprendizaje. La información valiosa se pierde en el momento en que termina una conferencia.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Contenido Inaccesible</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Las conferencias basadas en audio excluyen a estudiantes con discapacidades auditivas y no cumplen con los estándares modernos de accesibilidad.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Estudio Ineficaz</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Los estudiantes pasan más tiempo garabateando notas que interactuando con el material, lo que lleva a un aprendizaje pasivo y detalles olvidados.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Falta de Material de Revisión</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Una vez que termina una conferencia, no hay una manera fácil para que los estudiantes revisen un concepto específico o aclaren un punto que se perdieron.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900/40">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {featureHighlights.map((feature, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row gap-4 items-center">
                  {feature.icon}
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center">Preguntas Frecuentes</h2>
            <div className="mt-8 space-y-4">
              {faqItems.map((item, idx) => (
                <div key={idx} className="border rounded-md p-4">
                  <h3 className="font-semibold">{item.question}</h3>
                  <p className="text-muted-foreground mt-1">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 px-4 text-center bg-indigo-600 text-white">
          <h2 className="text-3xl font-bold">Cree un Ambiente de Aprendizaje Más Inclusivo Hoy</h2>
          <p className="mt-4 max-w-2xl mx-auto">
            Únase a instituciones líderes para hacer que la educación sea más accesible y efectiva. Comience con la transcripción de conferencias con IA.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={handleStartTranscribing}>
              Comenzar Prueba Gratuita
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-indigo-600" onClick={() => navigate("/pricing")}>
              Ver Planes
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
