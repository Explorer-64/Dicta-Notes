import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Mic, 
  Globe, 
  Users, 
  Download, 
  WifiOff, 
  Smartphone, 
  Zap, 
  FileText, 
  Building2,
  Shield,
  Languages,
  MonitorSpeaker,
  Clock,
  Search,
  Share2,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { logPageView } from "utils/analytics";
import { getCanonicalUrl } from "utils/seoUtils";

export default function Features() {
  const navigate = useNavigate();

  useEffect(() => {
    logPageView("Features");
  }, []);

  const featureCategories = [
    {
      title: "Core Transcription Features",
      icon: Mic,
      features: [
        {
          name: "Real-Time Transcription",
          description: "Watch your words appear instantly as you speak. No waiting, no delays—just immediate visual confirmation that your meeting is being captured.",
          icon: Zap
        },
        {
          name: "Advanced Speaker Identification",
          description: "Automatically distinguish between 10+ speakers with high accuracy. Easily rename speakers across the entire transcript with one click.",
          icon: Users
        },
        {
          name: "130+ Language Support",
          description: "Transcribe and translate meetings in over 130 languages including Spanish, French, German, Japanese, Korean, Polish, Vietnamese, and many more.",
          icon: Languages
        },
        {
          name: "AI-Powered Accuracy",
          description: "Powered by Gemini 2.5 Pro for saved sessions, delivering up to 98% accuracy with proper punctuation and formatting.",
          icon: MonitorSpeaker
        }
      ]
    },
    {
      title: "Offline & PWA Capabilities",
      icon: WifiOff,
      features: [
        {
          name: "100% Offline Recording",
          description: "Record meetings even without an internet connection. Perfect for field work, travel, or areas with poor connectivity.",
          icon: WifiOff
        },
        {
          name: "Progressive Web App",
          description: "Install on any device without an app store. Works on iOS, Android, Windows, Mac, and Linux with a native app-like experience.",
          icon: Smartphone
        },
        {
          name: "Auto-Save Every 30 Seconds",
          description: "Your recordings are automatically saved every 30 seconds, so you never lose your work even if something goes wrong.",
          icon: Clock
        },
        {
          name: "Sync When Online",
          description: "Recordings automatically sync to the cloud when you regain internet connection, making your transcripts accessible everywhere.",
          icon: Share2
        }
      ]
    },
    {
      title: "AI & Translation",
      icon: Globe,
      features: [
        {
          name: "Real-Time Translation",
          description: "Translate transcripts into any of 130+ languages instantly. Perfect for multilingual teams and international business.",
          icon: Globe
        },
        {
          name: "Gemini 2.5 Pro Processing",
          description: "Advanced AI processing for saved sessions provides superior accuracy, better speaker identification, and intelligent formatting.",
          icon: Zap
        },
        {
          name: "Bi-directional Translation",
          description: "Understand and be understood in global teams. Translate both ways to bridge language barriers seamlessly.",
          icon: Languages
        }
      ]
    },
    {
      title: "Collaboration & Management",
      icon: Building2,
      features: [
        {
          name: "Company Workspaces",
          description: "Organize transcripts by company or team. Perfect for agencies, consultants, and organizations managing multiple clients.",
          icon: Building2
        },
        {
          name: "Session Management",
          description: "Easily search, filter, and organize all your meeting transcripts. Find any conversation quickly with powerful search.",
          icon: Search
        },
        {
          name: "Share & Collaborate",
          description: "Share transcripts with team members, clients, or stakeholders. Control who has access to your meeting notes.",
          icon: Share2
        }
      ]
    },
    {
      title: "Export & Integration",
      icon: Download,
      features: [
        {
          name: "Multiple Export Formats",
          description: "Export your transcripts as PDF, Word (.docx), plain text, or Markdown. Choose the format that works best for your workflow.",
          icon: FileText
        },
        {
          name: "Full Transcript Access",
          description: "Access your complete meeting history from anywhere. All transcripts are securely stored and easily accessible.",
          icon: Download
        }
      ]
    },
    {
      title: "Privacy & Security",
      icon: Shield,
      features: [
        {
          name: "Firebase Secured",
          description: "Enterprise-grade encryption for cloud storage. Your data is protected with industry-standard security measures.",
          icon: Shield
        },
        {
          name: "Local Processing Option",
          description: "Keep sensitive audio on-device if needed. You control where your data is processed and stored.",
          icon: Smartphone
        },
        {
          name: "GDPR Compliant",
          description: "User-owned data with full export and delete controls. We respect your privacy and give you complete control.",
          icon: Shield
        }
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Helmet>
        <title>Features | Dicta-Notes - AI Meeting Transcription & Translation</title>
        <meta 
          name="description" 
          content="Discover all the features of Dicta-Notes: offline transcription, 130+ language support, speaker identification, PWA installation, real-time translation, and more. The complete meeting assistant that works without internet." 
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={getCanonicalUrl("/features")} />
        
        {/* Open Graph */}
        <meta property="og:title" content="Features | Dicta-Notes" />
        <meta property="og:description" content="Complete feature list: offline transcription, 130+ languages, speaker ID, PWA, real-time translation, and more." />
        <meta property="og:url" content="https://dicta-notes.com/features" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Features | Dicta-Notes" />
        <meta name="twitter:description" content="Complete feature list: offline transcription, 130+ languages, speaker ID, PWA, real-time translation, and more." />
        
        {/* Schema.org structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://dicta-notes.com/features#webpage",
            "url": "https://dicta-notes.com/features",
            "name": "Features | Dicta-Notes",
            "description": "Complete feature list for Dicta-Notes: offline transcription, 130+ language support, speaker identification, PWA installation, real-time translation, and more.",
            "isPartOf": {
              "@type": "WebSite",
              "@id": "https://dicta-notes.com/#website",
              "url": "https://dicta-notes.com",
              "name": "Dicta-Notes"
            },
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://dicta-notes.com"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Features",
                  "item": "https://dicta-notes.com/features"
                }
              ]
            }
          })}
        </script>
      </Helmet>

      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-muted/30 to-background py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Complete Feature Set
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Everything you need for professional meeting transcription, translation, and collaboration—all in one powerful PWA that works offline.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/install")}
                  className="text-lg"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/comparison")}
                  className="text-lg"
                >
                  Compare Features
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Categories */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="space-y-20">
              {featureCategories.map((category, categoryIndex) => {
                const CategoryIcon = category.icon;
                return (
                  <div key={categoryIndex} className="space-y-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <CategoryIcon className="h-8 w-8 text-primary" />
                      </div>
                      <h2 className="text-3xl md:text-4xl font-bold">
                        {category.title}
                      </h2>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {category.features.map((feature, featureIndex) => {
                        const FeatureIcon = feature.icon;
                        return (
                          <Card key={featureIndex} className="h-full hover:shadow-lg transition-shadow">
                            <CardHeader>
                              <div className="flex items-start gap-4">
                                <div className="p-2 rounded-lg bg-primary/10 mt-1">
                                  <FeatureIcon className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <CardTitle className="text-xl mb-2">
                                    {feature.name}
                                  </CardTitle>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <CardDescription className="text-base">
                                {feature.description}
                              </CardDescription>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Key Differentiators */}
        <section className="bg-muted/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                Why Choose Dicta-Notes?
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="p-4 rounded-full bg-primary/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <WifiOff className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Works Offline</h3>
                  <p className="text-muted-foreground">
                    Unlike competitors, Dicta-Notes records and transcribes completely offline. No internet required.
                  </p>
                </div>
                <div className="text-center">
                  <div className="p-4 rounded-full bg-primary/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Smartphone className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No App Store</h3>
                  <p className="text-muted-foreground">
                    Install as a PWA directly from your browser. No 100MB downloads or app store approvals.
                  </p>
                </div>
                <div className="text-center">
                  <div className="p-4 rounded-full bg-primary/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Globe className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">130+ Languages</h3>
                  <p className="text-muted-foreground">
                    More language support than most competitors. Translate and transcribe in virtually any language.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center bg-card p-12 rounded-lg border shadow-sm">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Experience These Features?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Start transcribing your meetings for free. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/install")}
                  className="text-lg"
                >
                  Install Dicta-Notes
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate("/getting-started-guide")}
                  className="text-lg"
                >
                  View Getting Started Guide
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
