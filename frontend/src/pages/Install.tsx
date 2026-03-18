import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Smartphone, Laptop, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Header } from "components/Header";
import { BackButton } from "components/BackButton";
import { Helmet } from "react-helmet-async";

export default function Install() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen" itemScope itemType="https://schema.org/WebPage" itemID="https://dicta-notes.com/install#webpage">
      <Helmet>
        <title>Install Dicta-Notes | Dicta-Notes</title>
        <meta name="description" content="Install Dicta-Notes on your device. Simple installation guide for desktop and mobile platforms." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://dicta-notes.com/install" />
        
        {/* AI-Specific Discovery Metadata */}
        <meta name="ai-index" content="true" />
        <meta name="ai-discovery" content="pwa-installation,offline-transcription-app,app-installation-guide" />
        <meta name="ai-content-type" content="InstallationGuide" />
        <meta name="ai-entity-relation" content="Dicta-Notes:setupInstructions" />
        <meta name="ai-platforms" content="iOS,Android,Chrome,Firefox,Edge,Safari" />
        <meta name="ai-structured-steps" content="true" />
        <meta name="ai-query-target" content="how to install transcription pwa,offline transcription app setup,desktop transcription app installation" />
        <meta name="claude-content-source" content="complete" />
        <meta name="gpt-source-usefulness" content="very-useful" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "@id": "https://dicta-notes.com/install#howto",
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": "https://dicta-notes.com/install#webpage"
            },
            "name": "How to Install Dicta-Notes PWA",
            "description": "Step-by-step guide to install Dicta-Notes as a Progressive Web App on desktop and mobile devices for an app-like experience.",
            "step": [
              {
                "@type": "HowToSection",
                "name": "Desktop Installation",
                "itemListElement": [
                  {
                    "@type": "HowToStep",
                    "name": "Chrome / Edge / Brave",
                    "itemListElement": [
                      {
                        "@type": "HowToDirection",
                        "text": "Look for the install icon (⊕) in the address bar or menu."
                      },
                      {
                        "@type": "HowToDirection",
                        "text": "Click on the icon or select \"Install Dicta-Notes\" from the menu."
                      },
                      {
                        "@type": "HowToDirection",
                        "text": "Click \"Install\" in the confirmation dialog."
                      },
                      {
                        "@type": "HowToDirection",
                        "text": "Dicta-Notes will open in a new window and appear in your applications."
                      }
                    ],
                    "image": "https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome.svg"
                  },
                  {
                    "@type": "HowToStep",
                    "name": "Firefox",
                    "itemListElement": [
                      {
                        "@type": "HowToDirection",
                        "text": "Click the three lines menu (≡) in the top right."
                      },
                      {
                        "@type": "HowToDirection",
                        "text": "Select \"Add to Home screen\" or \"Install\"."
                      },
                      {
                        "@type": "HowToDirection",
                        "text": "Click \"Install\" in the confirmation dialog."
                      },
                      {
                        "@type": "HowToDirection",
                        "text": "Dicta-Notes will be available from your applications."
                      }
                    ],
                    "image": "https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox.svg"
                  },
                  {
                    "@type": "HowToStep",
                    "name": "Safari (macOS)",
                    "itemListElement": [
                      {
                        "@type": "HowToTip",
                        "text": "Safari on macOS doesn't fully support installing PWAs directly. You can add it to your Dock for quick access."
                      },
                      {
                        "@type": "HowToDirection",
                        "text": "Click File → Add to Dock."
                      },
                      {
                        "@type": "HowToDirection",
                        "text": "Alternatively, create a bookmark for quick access."
                      }
                    ],
                    "image": "https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari.svg"
                  }
                ]
              },
              {
                "@type": "HowToSection",
                "name": "Mobile Installation",
                "itemListElement": [
                  {
                    "@type": "HowToStep",
                    "name": "Chrome (Android)",
                    "itemListElement": [
                      {
                        "@type": "HowToDirection",
                        "text": "Tap the three dots menu (⋮) in the top right."
                      },
                      {
                        "@type": "HowToDirection",
                        "text": "Select \"Add to Home screen\"."
                      },
                      {
                        "@type": "HowToDirection",
                        "text": "Enter a name or use the suggested name."
                      },
                      {
                        "@type": "HowToDirection",
                        "text": "Tap \"Add\" to create the home screen icon."
                      }
                    ],
                    "image": "https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome.svg"
                  },
                  {
                    "@type": "HowToStep",
                    "name": "Safari (iOS)",
                    "itemListElement": [
                      {
                        "@type": "HowToDirection",
                        "text": "Tap the share icon (rectangle with arrow) at the bottom of the screen."
                      },
                      {
                        "@type": "HowToDirection",
                        "text": "Scroll down and tap \"Add to Home Screen\"."
                      },
                      {
                        "@type": "HowToDirection",
                        "text": "Enter a name or use the suggested name."
                      },
                      {
                        "@type": "HowToDirection",
                        "text": "Tap \"Add\" in the top right to create the home screen icon."
                      }
                    ],
                    "image": "https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari.svg"
                  }
                ]
              }
            ],
            "totalTime": "PT2M" // Estimated time to complete installation
          })}
        </script>
        {/* WebPage Schema for Install Page */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": "https://dicta-notes.com/install#webpage",
            "url": "https://dicta-notes.com/install",
            "name": "Install Dicta-Notes | PWA Installation Instructions",
            "description": "Learn how to install Dicta-Notes as a Progressive Web App (PWA) on your desktop or mobile device for offline access and improved performance.",
            "isPartOf": {
              "@type": "WebPage",
              "@id": "https://dicta-notes.com/"
            },
            "mainEntity": {
              "@type": "HowTo",
              "@id": "https://dicta-notes.com/install#howto"
            }
          })}
        </script>
        {/* BreadcrumbList Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
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
                "name": "Install",
                "item": "https://dicta-notes.com/install"
              }
            ]
          })}
        </script>
      </Helmet>
      
      <Header />
      <div className="container mx-auto px-4 py-8">
        <BackButton />
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">Install Dicta-Notes as an App</h1>
      </div>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="prose max-w-none mb-10">
            <p className="lead text-xl mb-6">
              Dicta-Notes is a Progressive Web App (PWA) that can be installed on your device like a native app. 
              This gives you benefits like offline access, faster loading times, and a more app-like experience.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8" itemScope itemType="https://schema.org/ItemList">
              <div className="bg-primary/5 p-6 rounded-lg text-center" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <meta itemProp="position" content="1" />
                <Download className="h-12 w-12 mx-auto mb-3 text-primary" />
                <h3 className="text-xl font-semibold mb-2" itemProp="name">No App Store Required</h3>
                <p className="text-sm" itemProp="description">Install directly from your browser without going through an app store</p>
              </div>
              
              <div className="bg-primary/5 p-6 rounded-lg text-center" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <meta itemProp="position" content="2" />
                <Laptop className="h-12 w-12 mx-auto mb-3 text-primary" />
                <h3 className="text-xl font-semibold mb-2" itemProp="name">Works Offline</h3>
                <p className="text-sm" itemProp="description">Keep transcribing even without an internet connection</p>
              </div>
              
              <div className="bg-primary/5 p-6 rounded-lg text-center" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                <meta itemProp="position" content="3" />
                <Smartphone className="h-12 w-12 mx-auto mb-3 text-primary" />
                <h3 className="text-xl font-semibold mb-2" itemProp="name">Multiple Devices</h3>
                <p className="text-sm" itemProp="description">Install on desktop, laptop, tablet, or mobile devices</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4" id="desktop">Desktop Installation</h2>
              
              <div className="space-y-6">
                <div className="border rounded-lg p-6" itemScope itemType="https://schema.org/HowToStep">
                  <h3 className="text-xl font-semibold flex items-center mb-4" itemProp="name">
                    <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome.svg" className="h-6 w-6 mr-2" alt="Chrome logo" />
                    Chrome / Edge / Brave
                  </h3>
                  
                  <ol className="list-decimal pl-5 space-y-2" itemProp="itemListElement" itemScope itemType="https://schema.org/HowToDirection">
                    <li itemProp="text">Look for the install icon (⊕) in the address bar or menu</li>
                    <li itemProp="text">Click on the icon or select "Install Dicta-Notes" from the menu</li>
                    <li itemProp="text">Click "Install" in the confirmation dialog</li>
                    <li itemProp="text">Dicta-Notes will open in a new window and appear in your applications</li>
                  </ol>
                  
                  <div className="mt-4 p-3 bg-muted/30 rounded text-sm" itemScope itemType="https://schema.org/HowToTip">
                    <strong>Troubleshooting:</strong> <span itemProp="text">If you don't see the install icon, click the three dots menu (⋮) in the top right, then look for "Install Dicta-Notes" near the bottom of the menu.</span>
                  
                  <p className="mt-2" itemProp="text">If you've previously uninstalled the app and can't reinstall, clear your browser cache or try installing in a private/incognito window.</p>
                  </div>
                </div>
                
                <div className="border rounded-lg p-6" itemScope itemType="https://schema.org/HowToStep">
                  <h3 className="text-xl font-semibold flex items-center mb-4" itemProp="name">
                    <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox.svg" className="h-6 w-6 mr-2" alt="Firefox logo" />
                    Firefox
                  </h3>
                  
                  <ol className="list-decimal pl-5 space-y-2" itemProp="itemListElement" itemScope itemType="https://schema.org/HowToDirection">
                    <li itemProp="text">Click the three lines menu (≡) in the top right</li>
                    <li itemProp="text">Select "Add to Home screen" or "Install"</li>
                    <li itemProp="text">Click "Install" in the confirmation dialog</li>
                    <li itemProp="text">Dicta-Notes will be available from your applications</li>
                  </ol>
                </div>
                
                <div className="border rounded-lg p-6" itemScope itemType="https://schema.org/HowToStep">
                  <h3 className="text-xl font-semibold flex items-center mb-4" itemProp="name">
                    <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari.svg" className="h-6 w-6 mr-2" alt="Safari logo" />
                    Safari (macOS)
                  </h3>
                  
                  <p className="mb-4 text-muted-foreground" itemScope itemType="https://schema.org/HowToTip">
                    <span itemProp="text">Safari on macOS doesn't fully support installing PWAs. However, you can:</span>
                  </p>
                  
                  <ol className="list-decimal pl-5 space-y-2" itemProp="itemListElement" itemScope itemType="https://schema.org/HowToDirection">
                    <li itemProp="text">Click File → Add to Dock</li>
                    <li itemProp="text">Or create a bookmark for quick access</li>
                  </ol>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold mb-4" id="mobile">Mobile Installation</h2>
              
              <div className="space-y-6">
                <div className="border rounded-lg p-6" itemScope itemType="https://schema.org/HowToStep">
                  <h3 className="text-xl font-semibold flex items-center mb-4" itemProp="name">
                    <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome.svg" className="h-6 w-6 mr-2" alt="Chrome logo" />
                    Chrome (Android)
                  </h3>
                  
                  <ol className="list-decimal pl-5 space-y-2" itemProp="itemListElement" itemScope itemType="https://schema.org/HowToDirection">
                    <li itemProp="text">Tap the three dots menu (⋮) in the top right</li>
                    <li itemProp="text">Select "Add to Home screen"</li>
                    <li itemProp="text">Enter a name or use the suggested name</li>
                    <li itemProp="text">Tap "Add" to create the home screen icon</li>
                  </ol>
                </div>
                
                <div className="border rounded-lg p-6" itemScope itemType="https://schema.org/HowToStep">
                  <h3 className="text-xl font-semibold flex items-center mb-4" itemProp="name">
                    <img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari.svg" className="h-6 w-6 mr-2" alt="Safari logo" />
                    Safari (iOS)
                  </h3>
                  
                  <ol className="list-decimal pl-5 space-y-2" itemProp="itemListElement" itemScope itemType="https://schema.org/HowToDirection">
                    <li itemProp="text">Tap the share icon (rectangle with arrow) at the bottom of the screen</li>
                    <li itemProp="text">Scroll down and tap "Add to Home Screen"</li>
                    <li itemProp="text">Enter a name or use the suggested name</li>
                    <li itemProp="text">Tap "Add" in the top right to create the home screen icon</li>
                  </ol>
                </div>
              </div>
            </section>
            
            <section className="bg-muted/30 p-6 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
              
              <div className="space-y-4" itemScope itemType="https://schema.org/FAQPage">
                <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                  <h3 className="font-semibold text-lg" itemProp="name">How much storage space does the app use?</h3>
                  <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <p itemProp="text">Dicta-Notes typically uses less than 5MB for the app itself, plus additional space for your stored transcriptions.</p>
                  </div>
                </div>
                
                <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                  <h3 className="font-semibold text-lg" itemProp="name">Can I uninstall the app later?</h3>
                  <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <p itemProp="text">Yes, you can uninstall Dicta-Notes like any other app through your device's standard app uninstallation method.</p>
                  </div>
                </div>
                
                <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                  <h3 className="font-semibold text-lg" itemProp="name">Will my data sync between installed versions?</h3>
                  <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <p itemProp="text">Yes, as long as you're logged in, your data will sync between all your installed instances when you're online.</p>
                  </div>
                </div>
                
                <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                  <h3 className="font-semibold text-lg" itemProp="name">Do I need to install updates?</h3>
                  <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <p itemProp="text">No, Dicta-Notes automatically updates when you open the app while connected to the internet.</p>
                  </div>
                </div>
                
                <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
                  <h3 className="font-semibold text-lg" itemProp="name">Can I use Dicta-Notes without installing it?</h3>
                  <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <p itemProp="text">Yes, Dicta-Notes works perfectly in any modern web browser without installation. Installing as a PWA simply provides additional convenience features like offline access and a standalone app experience.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
