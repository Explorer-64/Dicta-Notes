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
    title: "Υιοθετήστε την Ασύγχρονη Εργασία",
    description: "Αντικαταστήστε τις συναντήσεις ενημέρωσης κατάστασης με αναζητήσιμες, συνοπτικές μεταγραφές. Κρατήστε όλους ενήμερους, ανεξάρτητα από τη ζώνη ώρας τους.",
  },
  {
    icon: <Search className="h-8 w-8 text-green-500" />,
    title: "Μια Αναζητήσιμη Μνήμη Ομάδας",
    description: "Κάθε συνομιλία γίνεται μέρος της συλλογικής βάσης γνώσεων της ομάδας σας. Βρείτε άμεσα βασικές αποφάσεις, προθεσμίες και στοιχεία δράσης.",
  },
  {
    icon: <Archive className="h-8 w-8 text-yellow-500" />,
    title: "Αυτόματες Σημειώσεις Συνάντησης",
    description: "Λάβετε λεπτομερείς σημειώσεις με αναγνώριση ομιλητή από το Google Gemini 2.5. Εστιάστε στη συνομιλία, όχι στη λήψη σημειώσεων.",
  },
];

const faqItems = [
  {
    question: "Πώς βοηθά αυτό να μειώσει την κόπωση των συναντήσεων;",
    answer: "Παρέχοντας αξιόπιστες και λεπτομερείς μεταγραφές, μπορείτε με σιγουριά να παραλείψετε συναντήσεις ενημέρωσης κατάστασης. Τα μέλη της ομάδας μπορούν να ενημερωθούν στο δικό τους χρόνο, οδηγώντας σε λιγότερες, πιο εστιασμένες ζωντανές συνεδρίες."
  },
  {
    question: "Μπορούμε να το ενσωματώσουμε με τα εργαλεία διαχείρισης έργων μας;",
    answer: "Αν και δεν έχουμε ακόμα άμεσες ενσωματώσεις, μπορείτε εύκολα να εξάγετε μεταγραφές σε διάφορες μορφές (Κείμενο, Markdown, Word) για να αντιγράψετε-επικολλήσετε στοιχεία δράσης και περιλήψεις σε εργαλεία όπως Asana, Jira ή Trello."
  },
  {
    question: "Ποια είναι η διαφορά μεταξύ της ομιλίας του προγράμματος περιήγησης και της τελικής μεταγραφής;",
    answer: "Το ζωντανό κείμενο που βλέπετε κατά την εγγραφή είναι για άμεση ανατροφοδότηση UX. Η τελική, υψηλής ακρίβειας μεταγραφή υποβάλλεται σε επεξεργασία από το Google Gemini 2.5 από τον αποθηκευμένο ήχο για μέγιστη ποιότητα και αξιοπιστία."
  },
  {
    question: "Είναι αυτό κατάλληλο για εμπιστευτικές εσωτερικές συζητήσεις;",
    answer: "Ναι. Χρησιμοποιούμε την ασφαλή υποδομή του Firebase για να διασφαλίσουμε ότι τα δεδομένα σας είναι κρυπτογραφημένα και προστατευμένα. Είναι μια ασφαλής λύση για τις περισσότερες επιχειρηματικές επικοινωνίες, αλλά δεν συμμορφωνόμαστε με το HIPAA."
  }
];

export default function RemoteTeamsEl() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView('Remote Teams EL Page', { language: 'el', niche: 'remote-teams' });
  }, []);

  const handleStartTranscribing = () => {
    localStorage.setItem('preferredLanguage', 'el');
    navigate("/Transcribe");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <html lang="el" />
        <title>Dicta-Notes για Απομακρυσμένες Ομάδες | Μεταγραφή AI για Κατανεμημένες Ομάδες</title>
        <meta name="description" content="Μεταγραφή συναντήσεων με AI για απομακρυσμένες και κατανεμημένες ομάδες. Μειώστε την κόπωση των συναντήσεων, ενεργοποιήστε την ασύγχρονη συνεργασία και δημιουργήστε μια αναζητήσιμη βάση γνώσεων σε διαφορετικές ζώνες ώρας." />
        <meta name="keywords" content="μεταγραφή απομακρυσμένης ομάδας, συναντήσεις κατανεμημένης ομάδας, ασύγχρονες σημειώσεις συνάντησης, συνεργασία ζωνών ώρας, τεκμηρίωση απομακρυσμένης εργασίας, παραγωγικότητα κατανεμημένης ομάδας" />
        <link rel="canonical" href="https://dicta-notes.com/remote-teams-el" />
        
        {/* Hreflang tags */}
        <link rel="alternate" hrefLang="en" href="https://dicta-notes.com/remote-teams" />
        <link rel="alternate" hrefLang="fr" href="https://dicta-notes.com/remote-teams-fr" />
        <link rel="alternate" hrefLang="es" href="https://dicta-notes.com/remote-teams-es" />
        <link rel="alternate" hrefLang="de" href="https://dicta-notes.com/remote-teams-de" />
        <link rel="alternate" hrefLang="el" href="https://dicta-notes.com/remote-teams-el" />
        <link rel="alternate" hrefLang="ko" href="https://dicta-notes.com/remote-teams-ko" />
        <link rel="alternate" hrefLang="x-default" href="https://dicta-notes.com/remote-teams" />

        {/* Open Graph */}
        <meta property="og:title" content="Dicta-Notes για Απομακρυσμένες Ομάδες" />
        <meta property="og:description" content="Μεταγραφή συναντήσεων AI για κατανεμημένες ομάδες. Ενεργοποιήστε την ασύγχρονη συνεργασία σε ζώνες ώρας με αυτόματες σημειώσεις." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://dicta-notes.com/remote-teams-el" />
        <meta property="og:locale" content="el_GR" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dicta-Notes για Απομακρυσμένες Ομάδες",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "inLanguage": "el",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Μεταγραφή συναντήσεων με AI για απομακρυσμένες και κατανεμημένες ομάδες. Μειώστε την κόπωση των συναντήσεων, ενεργοποιήστε την ασύγχρονη συνεργασία και δημιουργήστε αναζητήσιμη τεκμηρίωση σε ζώνες ώρας με αναγνώριση ομιλητή σε 130+ γλώσσες.",
            "audience": {
              "@type": "BusinessAudience",
              "name": "Απομακρυσμένες και Κατανεμημένες Ομάδες"
            }
          })}
        </script>
      </Helmet>
      <Header />

      <div className="bg-background text-foreground">
        {/* Hero Section */}
        <section className="text-center py-20 px-4 bg-gray-50 dark:bg-gray-900">
          <h1 className="text-4xl md:text-5xl font-bold">
            Περισσότερη Παραγωγικότητα, Λιγότερος Χρόνος σε Συναντήσεις
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-3xl mx-auto">
            Το Dicta-Notes δίνει στην απομακρυσμένη ομάδα σας τη δύναμη της ασύγχρονης επικοινωνίας με συναντήσεις μεταγραμμένες από AI. Μετατρέψτε κάθε συνομιλία σε δραστική, αναζητήσιμη τεκμηρίωση.
          </p>
          <div className="mt-8">
            <Button size="lg" onClick={handleStartTranscribing}>
              Ξεκινήστε τη Δωρεάν Δοκιμή σας
            </Button>
          </div>
        </section>

        {/* Translate Feature Notice */}
        <section className="py-8 px-4 bg-blue-50 dark:bg-blue-950/20">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-start">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100">💡 Συμβουλή: Μεταφράστε την Εφαρμογή</p>
                <p className="text-blue-800 dark:text-blue-200 mt-1">
                  Όταν κάνετε κλικ στο "Ξεκινήστε τη Δωρεάν Δοκιμή σας" και αποκτήσετε πρόσβαση στην εφαρμογή, η διεπαφή μπορεί να είναι στα αγγλικά. Μπορείτε εύκολα να τη μεταφράσετε στα ελληνικά (ή σε οποιαδήποτε από τις 130+ γλώσσες) κάνοντας κλικ στο κουμπί μετάφρασης (εικονίδιο υδρογείου 🌐) στην κεφαλίδα στο πάνω μέρος της σελίδας.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points Section */}
        <section className="py-16 px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold">Η Κατανεμημένη Ομάδα σας Πνίγεται στις Συναντήσεις;</h2>
            <p className="text-muted-foreground mt-4">
              Ο συντονισμός σε ζώνες ώρας συχνά οδηγεί σε υπερφόρτωση συναντήσεων, κλειστά συστήματα πληροφοριών και ατελείωτες ενημερώσεις κατάστασης που σκοτώνουν την παραγωγικότητα.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Κόπωση Συναντήσεων</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Οι διαδοχικές βιντεοκλήσεις δεν αφήνουν χρόνο για βαθιά εργασία. Οι σημαντικές συνομιλίες βιάζονται και τα μέλη της ομάδας αποδεσμεύονται.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Κλειστά Συστήματα Πληροφοριών</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Οι βασικές αποφάσεις που λαμβάνονται στις συναντήσεις χάνονται μόλις τελειώσει η κλήση, μη διαθέσιμες για όσους δεν μπόρεσαν να παραστούν.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Συγκρούσεις Ζώνης Ώρας</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Τα μέλη της ομάδας αναγκάζονται σε κλήσεις νωρίς το πρωί ή αργά το βράδυ, οδηγώντας σε εξουθένωση και άνιση συμμετοχή.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <h2 className="text-3xl font-bold">Εργαστείτε Εξυπνότερα, Όχι Σκληρότερα</h2>
            <p className="text-muted-foreground mt-2">
              Το Dicta-Notes είναι κατασκευασμένο για τη σύγχρονη, ασύγχρονη-πρώτα απομακρυσμένη ομάδα.
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
            <h2 className="text-3xl font-bold text-center mb-8">Οι Ερωτήσεις σας, Απαντημένες</h2>
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
          <h2 className="text-3xl font-bold">Έτοιμοι να Ανακτήσετε τον Χρόνο της Ομάδας σας;</h2>
          <p className="mt-4 max-w-2xl mx-auto">
            Ενδυναμώστε την κατανεμημένη ομάδα σας με τα εργαλεία για να επικοινωνεί αποτελεσματικά, ανεξάρτητα από το πού ή πότε εργάζονται.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={handleStartTranscribing}>
              Ξεκινήστε Δωρεάν Δοκιμή Τώρα
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-green-600" onClick={() => navigate("/pricing")}>
              Δείτε Τιμές
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
