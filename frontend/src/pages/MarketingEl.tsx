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
    title: "Μην Χάσετε Ποτέ μια Δημιουργική Ιδέα",
    description: "Καταγράψτε κάθε brainstorming, κάθε σπίθα δημιουργικότητας. Η AI μας μεταγράφει τις συνεδρίες σας ώστε οι λαμπρές ιδέες να μην ξεφεύγουν ποτέ.",
  },
  {
    icon: <Users className="h-8 w-8 text-green-500" />,
    title: "Πολυγλωσσική Συνεργασία Ομάδας",
    description: "Εργαστείτε απρόσκοπτα με δημιουργικές ομάδες σε διαφορετικές γλώσσες. Μεταγραφή σε πραγματικό χρόνο υποστηρίζει 130+ γλώσσες για πραγματική παγκόσμια συνεργασία.",
  },
  {
    icon: <FileText className="h-8 w-8 text-yellow-500" />,
    title: "Αυτόματη Τεκμηρίωση Συναντήσεων",
    description: "Εστιάστε στη δημιουργική ροή ενώ εμείς χειριζόμαστε τις σημειώσεις. Λάβετε μεταγραφές με αναγνώριση ομιλητή για κάθε αναθεώρηση καμπάνιας και συνεδρία ιδεών.",
  },
  {
    icon: <Globe className="h-8 w-8 text-purple-500" />,
    title: "Αρχείο Δημιουργικότητας με Αναζήτηση",
    description: "Δημιουργήστε μια βάση γνώσης δημιουργικών αποφάσεων. Αναζητήστε εύκολα παλιά brainstormings για να βρείτε εκείνη την τέλεια ιδέα που συζητήσατε πριν μήνες.",
  },
];

const faqItems = [
  {
    question: "Πώς βοηθά αυτό στις δημιουργικές συνεδρίες brainstorming;",
    answer: "Κατά τη διάρκεια του brainstorming, οι ιδέες ρέουν γρήγορα. Το Dicta-Notes καταγράφει αυτόματα κάθε πρόταση και ιδέα, επιτρέποντας στην ομάδα σας να παραμείνει στη δημιουργική ροή χωρίς να ανησυχεί για τις σημειώσεις. Ελέγξτε την πλήρη μεταγραφή αργότερα για να εντοπίσετε τις καλύτερες ιδέες."
  },
  {
    question: "Μπορούμε να το χρησιμοποιήσουμε για παρουσιάσεις πελατών και συνεδρίες ανατροφοδότησης;",
    answer: "Απολύτως! Καταγράψτε συναντήσεις πελατών, κριτικές σχεδιασμού και συνεδρίες ανατροφοδότησης. Θα έχετε ακριβή καταγραφή των αιτημάτων πελατών, της δημιουργικής κατεύθυνσης και των αποφάσεων έγκρισης - ιδανικό για αναφορά και λογοδοσία."
  },
  {
    question: "Τι γίνεται με τις πολυγλωσσικές ομάδες;",
    answer: "Το Dicta-Notes υποστηρίζει 130+ γλώσσες με αναγνώριση ομιλητή. Εάν η δημιουργική σας ομάδα εκτείνεται σε πολλές χώρες, όλοι μπορούν να συμμετέχουν στη γλώσσα που προτιμούν, και η μεταγραφή τα καταγράφει όλα."
  },
  {
    question: "Πόσο ασφαλές είναι το δημιουργικό μας περιεχόμενο;",
    answer: "Όλες οι μεταγραφές είναι κρυπτογραφημένες και αποθηκευμένες με ασφάλεια μέσω της υποδομής Firebase. Οι δημιουργικές σας ιδέες, οι ιδέες καμπάνιας και οι συζητήσεις με πελάτες παραμένουν εμπιστευτικές και προστατευμένες."
  }
];

export default function MarketingEl() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Marketing EL Page', { language: 'el', niche: 'marketing' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'el');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="el" />
        <title>Dicta-Notes για Ομάδες Marketing | Μεταγραφή AI για Δημιουργικούς</title>
        <meta name="description" content="Μεταγραφή με AI για ομάδες marketing και δημιουργικούς επαγγελματίες. Μην χάσετε ποτέ μια λαμπρή ιδέα από συνεδρίες brainstorming. Ιδανικό για σχεδιασμό καμπάνιας, αξιολογήσεις σχεδίου και πολυγλωσσική συνεργασία." />
        <meta name="keywords" content="μεταγραφή marketing, συναντήσεις δημιουργικής ομάδας, τεκμηρίωση brainstorming, σημειώσεις σχεδιασμού καμπάνιας, μεταγραφή αξιολόγησης σχεδίου, πολυγλωσσικές ομάδες marketing" />
        <link rel="canonical" href="https://dicta-notes.com/marketing-el" />
        
        {/* Hreflang tags for marketing pages */}
        <link rel="alternate" hrefLang="en" href="https://dicta-notes.com/marketing" />
        <link rel="alternate" hrefLang="fr" href="https://dicta-notes.com/marketing-fr" />
        <link rel="alternate" hrefLang="es" href="https://dicta-notes.com/marketing-es" />
        <link rel="alternate" hrefLang="de" href="https://dicta-notes.com/marketing-de" />
        <link rel="alternate" hrefLang="el" href="https://dicta-notes.com/marketing-el" />
        <link rel="alternate" hrefLang="ko" href="https://dicta-notes.com/marketing-ko" />
        <link rel="alternate" hrefLang="x-default" href="https://dicta-notes.com/marketing" />

        {/* Open Graph */}
        <meta property="og:title" content="Dicta-Notes για Ομάδες Marketing & Δημιουργικούς" />
        <meta property="og:description" content="Μεταγραφή AI για brainstorming, σχεδιασμό καμπάνιας και δημιουργικές αξιολογήσεις. Μην χάσετε ποτέ μια σπουδαία ιδέα." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/marketing-el" />
        <meta property="og:locale" content="el_GR" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes για Ομάδες Marketing",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "el",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Μεταγραφή συναντήσεων με AI για ομάδες marketing και δημιουργικούς. Καταγράψτε συνεδρίες brainstorming, σχεδιασμό καμπάνιας και αξιολογήσεις σχεδίου με αναγνώριση ομιλητή σε 130+ γλώσσες.",
            "audience": {
              "@type": "BusinessAudience",
              "name": "Επαγγελματίες Marketing και Δημιουργικοί"
            }
          })}
        </script>
      </Helmet>
      <Header />

      <div className="bg-background text-foreground">
        {/* Hero Section */}
        <section className="text-center py-20 px-4 bg-gray-50 dark:bg-gray-900">
          <h1 className="text-4xl md:text-5xl font-bold">
            Καταγράψτε Κάθε Δημιουργική Σπίθα
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Το Dicta-Notes μετατρέπει τις συνεδρίες brainstorming και τις δημιουργικές συναντήσεις σας σε τεκμηρίωση με δυνατότητα αναζήτησης και δράσης. Εστιάστε στην καινοτομία ενώ η AI χειρίζεται τις σημειώσεις.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={handleStartTranscribing}>
              Δωρεάν Δοκιμή
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
                  Όταν κάνετε κλικ στο "Δωρεάν Δοκιμή" και αποκτήσετε πρόσβαση στην εφαρμογή, η διεπαφή μπορεί να είναι στα αγγλικά. Μπορείτε εύκολα να τη μεταφράσετε στα ελληνικά (ή σε οποιαδήποτε από τις 130+ γλώσσες) κάνοντας κλικ στο κουμπί μετάφρασης (εικονίδιο υδρογείου 🌐) στην κεφαλίδα στο πάνω μέρος της σελίδας.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-16 px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold">Χάνονται οι Λαμπρές Ιδέες;</h2>
            <p className="text-muted-foreground mt-4">
              Οι γρήγορες δημιουργικές συνεδρίες δημιουργούν καταπληκτικές ιδέες, αλλά οι χειροκίνητες σημειώσεις σκοτώνουν την ορμή και οι σπουδαίες ιδέες χάνονται σε διασκορπισμένες σημειώσεις.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Χαμένες Δημιουργικές Ιδέες</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Κατά τη διάρκεια έντονου brainstorming, κάποιος πάντα παλεύει να κρατήσει σημειώσεις. Σπουδαίες ιδέες χάνονται επειδή κανείς δεν τις κατέγραψε σωστά.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Διασκορπισμένη Τεκμηρίωση</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Οι αποφάσεις καμπάνιας και η δημιουργική κατεύθυνση καταλήγουν σε τυχαία σημειωματάρια, ημιτελή Google docs ή χειρότερα - μόνο στη μνήμη των ανθρώπων.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Γλωσσικά Εμπόδια</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Οι παγκόσμιες δημιουργικές ομάδες παλεύουν όταν οι συναντήσεις αναμειγνύουν πολλές γλώσσες, καθιστώντας δύσκολη την ακριβή καταγραφή των συνεισφορών όλων.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Κατασκευασμένο για Δημιουργική Ροή</h2>
            <p className="text-muted-foreground mt-2">
              Σχεδιασμένο για ομάδες marketing και δημιουργικούς επαγγελματίες που πρέπει να προχωρούν γρήγορα χωρίς να χάνουν ιδέες.
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
            <h2 className="text-3xl font-bold text-center mb-12">Ιδανικό για τη Δημιουργική σας Ροή Εργασίας</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Brainstorming Καμπάνιας</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Καταγράψτε κάθε ιδέα, σλόγκαν και δημιουργική κατεύθυνση κατά τη δημιουργία καμπάνιας. Ελέγξτε την πλήρη μεταγραφή για να επιλέξετε τις καλύτερες ιδέες και να δημιουργήσετε ολοκληρωμένα briefs.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Κριτικές Σχεδίου</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Τεκμηριώστε όλα τα σχόλια από τις αξιολογήσεις σχεδίου. Κρατήστε σαφή καταγραφή του τι λειτούργησε, τι όχι και την αιτιολόγηση πίσω από τις δημιουργικές αποφάσεις.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Παρουσιάσεις Πελατών</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Καταγράψτε συνεδρίες ανατροφοδότησης πελατών για να διασφαλίσετε ότι τίποτα δεν χάνεται. Έχετε ακριβή αναφορά για αναθεωρήσεις, εγκρίσεις και συζητήσεις πεδίου εφαρμογής.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Σχεδιασμός Περιεχομένου</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Μετατρέψτε στρατηγικές συναντήσεις σε ημερολόγια περιεχομένου με δυνατότητα αναζήτησης. Μην αναρωτιέστε ποτέ ξανά "ποιος πρότεινε αυτό το θέμα;" ή "ποια ήταν η προσέγγιση που συζητήσαμε;"</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Ερωτήσεις από Δημιουργικές Ομάδες</h2>
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
          <h2 className="text-3xl font-bold">Έτοιμοι να Μην Χάσετε Ποτέ Άλλη Σπουδαία Ιδέα;</h2>
          <p className="mt-4 max-w-2xl mx-auto">
            Ενταχθείτε σε δημιουργικές ομάδες παγκοσμίως που χρησιμοποιούν μεταγραφή AI για να καταγράφουν, οργανώνουν και δρουν επί των καλύτερων ιδεών τους.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={handleStartTranscribing}>
              Ξεκινήστε Δωρεάν Δοκιμή Τώρα
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-purple-600" onClick={() => navigate("/pricing")}>
              Δείτε Τιμές
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
