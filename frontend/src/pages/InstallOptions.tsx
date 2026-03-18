import React, { useState, useEffect } from "react"; // Added useState, useEffect
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "components/Header";
import { Download, BookOpen, ArrowLeft } from "lucide-react";
import { usePWAStore } from "@/utils/pwaStore"; // Added
import { toast } from "sonner"; // Added

export default function InstallOptionsPage() {
  const navigate = useNavigate();
  const {
    installApp,
    deferredPrompt,
    isInstalled,
  } = usePWAStore();
  const [showShortcutInstructions, setShowShortcutInstructions] = useState(false);
  const [platformInstructions, setPlatformInstructions] = useState("");

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    // More specific browser checks can be added if needed
    const isChrome = /chrome/.test(ua) && !/edge|edg/.test(ua); // Exclude Edge
    const isFirefox = /firefox/.test(ua);
    const isEdge = /edge|edg/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome/.test(ua) && !/edge|edg/.test(ua); // Exclude Chrome & Edge

    let instructions = "";
    if (isIOS) {
      instructions = "On your iPhone or iPad: Tap the Share button (icon with an arrow pointing up) at the bottom of Safari, then scroll down and tap 'Add to Home Screen'.";
    } else if (isAndroid && isChrome) {
      instructions = "On your Android device: Tap the three dots menu in Chrome, then tap 'Add to Home screen'. You might also see an 'Install app' option if available.";
    } else if (isAndroid) { // Generic Android
      instructions = "On your Android device: Open your browser's menu (usually three dots or lines), and look for an 'Add to Home Screen' or 'Install app' option.";
    } else if (isChrome) {
      instructions = "In Chrome on your computer: Click the three dots menu (top-right), go to 'Save and share', then 'Create shortcut...'. Make sure to check 'Open as window'.";
    } else if (isEdge) {
      instructions = "In Edge on your computer: Click the three dots menu (top-right), go to 'Apps', then 'Install this site as an app'.";
    } else if (isFirefox) {
      instructions = "In Firefox on your computer: While you can bookmark this page, Firefox desktop doesn\'t offer a direct 'Add to Home Screen' or 'Create shortcut' like other browsers for PWAs. Consider using Chrome or Edge for an app-like experience, or simply bookmark the page.";
    } else if (isSafari) {
      instructions = "In Safari on your Mac: You can drag the URL from the address bar to your Dock. For a more app-like experience, consider using Chrome or Edge which have better PWA support.";
    } else {
      instructions = "In your browser, look for an 'Add to Home Screen', 'Install app', or 'Create shortcut' option, usually found in the main menu (often three dots or lines).";
    }
    setPlatformInstructions(instructions);
  }, []);

  const handleInstallApp = async () => {
    console.log("Install Full App button clicked");

    if (isInstalled) {
      toast.info("App is already installed.");
      return;
    }

    if (!deferredPrompt) {
      toast.error(
        "Installation is not available right now. Please ensure PWA installation is supported and try again later.",
        { duration: 5000 },
      );
      // Optionally, guide to manual shortcut as a fallback if no prompt
      return;
    }

    try {
      const success = await installApp(); // This now uses the logic from pwaStore
      
      if (success) {
        toast.success("Dicta-Notes installed successfully!");
        // The pwaStore should handle isInstalled state and clearing the prompt
      } else {
        // pwaStore.installApp() might show iOS specific instructions via toast
        // Check if it was just a dismissal or a true failure if needed
        // For now, a general message if not successful for non-iOS or if prompt was dismissed
        const userAgent = navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        if (!isIOS) { // pwaStore shows its own toast for iOS
            toast.info("Installation was cancelled or could not be completed. You can try again later.");
        }
      }
    } catch (error) {
      console.error("Error during PWA installation:", error);
      toast.error("An error occurred during installation. Please try again.");
    }
  };

  const handleLearnShortcut = () => {
    console.log("Learn How to Add Shortcut button clicked");
    setShowShortcutInstructions(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Choose Your Dicta-Notes Installation</title>
        <meta name="description" content="Choose how to install or add Dicta-Notes to your device for the best experience." />
      </Helmet>
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)} 
            className="mb-4 text-sm text-gray-600 hover:text-gray-900 self-start"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <h1 className="text-3xl font-bold tracking-tight text-center">
            Add Dicta-Notes to Your Home Screen
          </h1>
          <p className="text-lg text-muted-foreground text-center">
            You can add Dicta-Notes to your home screen for easy access. Choose an
            option below based on how you&apos;d like to use the app, especially if
            you rely on your browser&apos;s page translation features.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mt-8">
            {/* Option 1: Full App Experience */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Option 1: Install Full App Experience
                </CardTitle>
                <CardDescription>
                  Installs Dicta-Notes like a dedicated app on your device.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <p className="text-sm">
                  You&apos;ll get a home screen icon for quick launching, and it&apos;s
                  designed for a focused, app-like feel.
                </p>
                <div>
                  <h4 className="font-medium text-sm mb-1">Benefits:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                    <li>Fast loading and performance.</li>
                    <li>Potential for offline access to your notes (once loaded).</li>
                    <li>A clean, distraction-free interface.</li>
                    <li>Enhanced speaker identification.</li>
                    <li>Live translation capabilities.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-1 text-amber-700 dark:text-amber-500">Important Note:</h4>
                  <p className="text-sm text-muted-foreground">
                    When installed this way, your browser&apos;s menus and address
                    bar (including the built-in &quot;Translate Page&quot; option) will
                    likely be hidden. If you frequently use browser translation
                    for the app&apos;s interface, please consider Option 2.
                  </p>
                </div>
              </CardContent>
              <div className="p-6 pt-0 mt-auto">
                <Button 
                  onClick={handleInstallApp} 
                  className="w-full"
                  disabled={!deferredPrompt || isInstalled}
                  title={isInstalled ? "App is already installed" : !deferredPrompt ? "Installation not available" : "Install the full app experience"}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isInstalled ? "App Installed" : "Install Full App"}
                </Button>
              </div>
            </Card>

            {/* Option 2: Standard Browser Shortcut */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Option 2: Keep All Browser Features
                </CardTitle>
                <CardDescription>
                  Recommended for users who rely on browser translation.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <p className="text-sm">
                  This option guides you to add a standard shortcut to
                  Dicta-Notes on your home screen. The app will open in your
                  regular web browser, just like any other website.
                </p>
                <div>
                  <h4 className="font-medium text-sm mb-1">Benefits:</h4>
                  <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                    <li>Full access to all your browser&apos;s features, including the &quot;Translate Page&quot; option for the app interface.</li>
                    <li>Familiar browser navigation and menus.</li>
                    <li>No special installation needed – just a simple bookmark on your home screen.</li>
                  </ul>
                </div>
              </CardContent>
              <div className="p-6 pt-0 mt-auto">
                <Button onClick={handleLearnShortcut} variant="outline" className="w-full">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Learn How to Add Shortcut
                </Button>
                {showShortcutInstructions && (
                  <div className="mt-4 p-4 border rounded-md bg-slate-50 dark:bg-slate-800 text-sm">
                    <h5 className="font-semibold mb-2">Instructions:</h5>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {platformInstructions}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowShortcutInstructions(false)}
                      className="mt-3 w-full text-center"
                    >
                      Close Instructions
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
