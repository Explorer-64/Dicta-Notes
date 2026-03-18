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
    title: "Προσβασιμότητα για Όλους τους Φοιτητές",
    description: "Παρέχετε ακριβείς μεταγραφές για όλες τις διαλέξεις, υποστηρίζοντας τη συμμόρφωση και κάνοντας το περιεχόμενο προσβάσιμο σε όλους τους φοιτητές, συμπεριλαμβανομένων αυτών με προβλήματα ακοής.",
  },
  {
    icon: <BookOpen className="h-8 w-8 text-green-500" />,
    title: "Μετατρέψτε τις Διαλέξεις σε Βοηθήματα Μελέτης",
    description: "Οι φοιτητές μπορούν να μετατρέψουν μακροσκελείς ηχογραφήσεις διαλέξεων σε κείμενο με δυνατότητα αναζήτησης και παράθεσης, διευκολύνοντας τη μελέτη, τη συγγραφή εργασιών και την επανεξέταση βασικών εννοιών.",
  },
  {
    icon: <FileText className="h-8 w-8 text-yellow-500" />,
    title: "Αυτόματη Καταγραφή Διαλέξεων",
    description: "Εγγράψτε οποιοδήποτε μάθημα, είτε αυτοπροσώπως είτε διαδικτυακά, και αφήστε την AI μας να αναλάβει τη σημειογραφία. Δημιουργήστε ένα μόνιμο, ακριβές αρχείο κάθε μαθήματος.",
  },
  {
    icon: <Globe className="h-8 w-8 text-purple-500" />,
    title: "Ιδανικό για Διεθνείς Φοιτητές",
    description: "Πολυγλωσσική υποστήριξη με μετάφραση σε πραγματικό χρόνο σε πάνω από 130 γλώσσες - τέλειο για διεθνή πανεπιστήμια και ξένους φοιτητές.",
  },
];

const faqItems = [
  {
    question: "Πώς αυτό βοηθά το ίδρυμά μας να πληροί τις απαιτήσεις προσβασιμότητας;",
    answer: "Παρέχοντας ακριβείς, χρονοσημασμένες μεταγραφές διαλέξεων και εκπαιδευτικού υλικού, προσφέρετε μια ισότιμη εναλλακτική λύση για φοιτητές με προβλήματα ακοής και άλλες μαθησιακές ανάγκες."
  },
  {
    question: "Είναι περίπλοκο για τους καθηγητές να χρησιμοποιήσουν;",
    answer: "Καθόλου. Η διαδικασία είναι απλή: ξεκινήστε την εγγραφή και εμείς αναλαμβάνουμε τα υπόλοιπα. Απαιτεί ελάχιστες τεχνικές δεξιότητες και επιτρέπει στους εκπαιδευτές να εστιάσουν στη διδασκαλία, όχι στην τεχνολογία."
  },
  {
    question: "Μπορούν οι φοιτητές να το χρησιμοποιήσουν για τις δικές τους ομάδες μελέτης;",
    answer: "Απολύτως. Οι φοιτητές μπορούν να χρησιμοποιήσουν το Dicta-Notes για να εγγράψουν και να μεταγράψουν συνεδρίες μελέτης, ομαδικά έργα και συζητήσεις επανεξέτασης, δημιουργώντας ένα κοινό αποθετήριο γνώσης."
  },
  {
    question: "Σε ποιες μορφές μπορούμε να εξάγουμε τις μεταγραφές;",
    answer: "Μπορείτε να εξάγετε μεταγραφές ως PDF, Word, απλό κείμενο και Markdown, διευκολύνοντας την κοινή χρήση, την αρχειοθέτηση και την ενσωμάτωση στο Σύστημα Διαχείρισης Μάθησης (LMS) σας."
  }
];

export default function GreekEducation() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Greek Education Page', { language: 'el', niche: 'education' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'el');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="el" />
        <title>Dicta-Notes για Εκπαίδευση | Μεταγραφή Μαθημάτων με AI</title>
        <meta name="description" content="Λύση μεταγραφής με AI για εκπαίδευση. Μετατρέψτε διαλέξεις και σεμινάρια σε σημειώσεις με δυνατότητα αναζήτησης. Ιδανικό για φοιτητές, καθηγητές και πανεπιστήμια. Πολυγλωσσική υποστήριξη για διεθνείς φοιτητές." />
        <link rel="canonical" href="https://dicta-notes.com/greek-education" />
        <meta name="robots" content="index, follow" />
        
        {/* Hreflang tags for education pages */}
        <link rel="alternate" hrefLang="el" href="https://dicta-notes.com/greek-education" />
        <link rel="alternate" hrefLang="fr" href="https://dicta-notes.com/french-education" />
        <link rel="alternate" hrefLang="es" href="https://dicta-notes.com/spanish-education" />
        <link rel="alternate" hrefLang="de" href="https://dicta-notes.com/german-education" />
        <link rel="alternate" hrefLang="ko" href="https://dicta-notes.com/korean-education" />
        <link rel="alternate" hrefLang="x-default" href="https://dicta-notes.com/education" />

        {/* Open Graph */}
        <meta property="og:title" content="Dicta-Notes για Εκπαίδευση | Μεταγραφή Μαθημάτων" />
        <meta property="og:description" content="Μεταγραφή με AI για μαθήματα, σεμινάρια και ομάδες μελέτης. Προσβάσιμο, πολυγλωσσικό, εύκολο στη χρήση." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/greek-education" />
        <meta property="og:locale" content="el_GR" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": "https://dicta-notes.com/greek-education#app",
            "url": "https://dicta-notes.com/greek-education",
            "name": "Dicta-Notes για Εκπαίδευση",
            "applicationCategory": "EducationalApplication",
            "operatingSystem": "Web",
            "inLanguage": "el",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Μεταγραφή μαθημάτων σε πραγματικό χρόνο με AI. Μετατρέψτε μαθήματα σε σημειώσεις με δυνατότητα αναζήτησης και αναγνώριση ομιλητών. Υποστήριξη 130+ γλωσσών για διεθνείς φοιτητές.",
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
            Ενδυναμώστε Κάθε Φοιτητή με Προσβάσιμη Μάθηση
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Το Dicta-Notes μετατρέπει τις διαλέξεις σας σε ακριβείς, αναζητήσιμες μεταγραφές. Βελτιώστε την προσβασιμότητα, υποστηρίξτε τη συμμόρφωση και δώστε στους φοιτητές σας ισχυρά εργαλεία για επιτυχία.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={handleStartTranscribing}>
              Ξεκινήστε Δωρεάν
            </Button>
          </div>
        </section>

        {/* Translate Feature Notice */}
        <section className="py-8 px-4 bg-blue-50 dark:bg-blue-950/20">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-start">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100">💡 Συμβουλή: Μετάφραση Εφαρμογής</p>
                <p className="text-blue-800 dark:text-blue-200 mt-1">
                  Όταν κάνετε κλικ στο "Ξεκινήστε Δωρεάν" και εισέλθετε στην εφαρμογή, η διεπαφή μπορεί να είναι στα αγγλικά. Μπορείτε εύκολα να τη μεταφράσετε στα ελληνικά (ή σε οποιαδήποτε από τις 130+ γλώσσες) κάνοντας κλικ στο κουμπί μετάφρασης (εικονίδιο υδρογείου 🌐) στην κεφαλίδα στο πάνω μέρος της σελίδας.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-16 px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold">Οι Φοιτητές σας Δυσκολεύονται να Ακολουθήσουν;</h2>
            <p className="text-muted-foreground mt-4">
              Η χειροκίνητη σημειογραφία είναι αναποτελεσματική και δημιουργεί εμπόδια για φοιτητές με διάφορες μαθησιακές ανάγκες. Πολύτιμες πληροφορίες χάνονται τη στιγμή που τελειώνει μια διάλεξη.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Μη Προσβάσιμο Περιεχόμενο</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Οι διαλέξεις βασισμένες στην ακοή αποκλείουν φοιτητές με προβλήματα ακοής και δεν ανταποκρίνονται στα σύγχρονα πρότυπα προσβασιμότητας.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Αναποτελεσματική Μελέτη</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Οι φοιτητές περνούν περισσότερο χρόνο γράφοντας σημειώσεις παρά ασχολούμενοι με το υλικό, οδηγώντας σε παθητική μάθηση και λεπτομέρειες που ξεχνιούνται.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Έλλειψη Υλικού Επανεξέτασης</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Μόλις τελειώσει μια διάλεξη, δεν υπάρχει εύκολος τρόπος για τους φοιτητές να επανεξετάσουν μια συγκεκριμένη έννοια ή να διευκρινίσουν ένα σημείο που έχασαν.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Μια Εξυπνότερη Τάξη για Όλους</h2>
            <p className="text-muted-foreground mt-2">
              Σχεδιασμένο για εκπαιδευτικούς και φοιτητές που εκτιμούν την προσβάσιμη και αποτελεσματική μάθηση.
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
            <h2 className="text-3xl font-bold text-center mb-8">Ερωτήσεις από Εκπαιδευτικούς</h2>
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
          <h2 className="text-3xl font-bold">Δημιουργήστε ένα Πιο Χωρίς Αποκλεισμούς Μαθησιακό Περιβάλλον Σήμερα</h2>
          <p className="mt-4 max-w-2xl mx-auto">
            Συμμετάσχετε σε κορυφαία ιδρύματα για να κάνετε την εκπαίδευση πιο προσβάσιμη και αποτελεσματική. Ξεκινήστε με μεταγραφή διαλέξεων με AI.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={handleStartTranscribing}>
              Ξεκινήστε Δωρεάν Δοκιμή
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-indigo-600" onClick={() => navigate("/pricing")}>
              Δείτε τα Πακέτα
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
