import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async";
import { Home, ArrowLeft, Search, FileText, MessageCircle } from "lucide-react";
import { logPageView } from "utils/analytics";

// Map of short codes/legacy paths to canonical paths
// This resolves Soft 404s in Google Search Console by redirecting to the correct page
const REDIRECT_MAP: Record<string, string> = {
  "/ta": "/tamil",
  "/bn": "/bengali",
  "/ms": "/malay",
  "/sw": "/swahili",
  "/pa": "/punjabi",
  "/te": "/telugu",
  "/tr": "/turkish",
  "/zu": "/zulu",
  "/pl": "/polish",
  "/vi": "/vietnamese",
  "/af": "/afrikaans",
  "/id": "/indonesian",
  "/th": "/thai",
  "/ha": "/hausa",
  "/ko": "/korean",
  "/de": "/german",
  "/fr": "/french",
  "/zh": "/chinese",
  "/ar": "/arabic",
  "/pt": "/portuguese",
  "/es": "/spanish",
  "/ja": "/japanese",
  "/hi": "/hindi",
  "/ru": "/russian",
  "/yo": "/yoruba",
  "/tl": "/tagalog",
  "/signup": "/login",
  "/faqs": "/fa-qs",
};

export default function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if the current path should be redirected (case-insensitive)
    const path = location.pathname.toLowerCase();
    // Handle trailing slashes if necessary, though pathname usually doesn't have them in simple cases
    const cleanPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
    
    const redirectPath = REDIRECT_MAP[cleanPath];
    
    if (redirectPath) {
      // Perform client-side redirect
      // Use replace to avoid stacking redirects in history
      navigate(redirectPath, { replace: true });
      return;
    }

    // Generic case-insensitive redirect
    // If the current path is different from the lowercase version (and we are in NotFound),
    // try redirecting to the lowercase version.
    if (location.pathname !== path) {
      navigate(path, { replace: true });
      return;
    }

    // Only log 404 if we're not redirecting
    logPageView('404 Error Page', {
      error_type: '404',
      referrer: document.referrer,
      path: location.pathname
    });
  }, [location.pathname, navigate]);

  // If we are redirecting, return null to prevent flashing 404 content
  const path = location.pathname.toLowerCase();
  const cleanPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
  if (REDIRECT_MAP[cleanPath]) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Page Not Found | Dicta-Notes</title>
        <meta name="description" content="The page you're looking for doesn't exist. Find your way back to Dicta-Notes with our helpful navigation links." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold">Page Not Found</CardTitle>
            <CardDescription className="text-lg">
              The page you're looking for doesn't exist or has been moved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 h-auto p-4"
                variant="outline"
              >
                <Home className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Go Home</div>
                  <div className="text-sm text-muted-foreground">Return to homepage</div>
                </div>
              </Button>
              
              <Button
                onClick={() => navigate("/transcribe")}
                className="flex items-center gap-2 h-auto p-4"
                variant="outline"
              >
                <FileText className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Start Transcribing</div>
                  <div className="text-sm text-muted-foreground">Begin a new session</div>
                </div>
              </Button>
              
              <Button
                onClick={() => navigate("/instructions")}
                className="flex items-center gap-2 h-auto p-4"
                variant="outline"
              >
                <FileText className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">How to Use</div>
                  <div className="text-sm text-muted-foreground">Learn the basics</div>
                </div>
              </Button>
              
              <Button
                onClick={() => navigate("/contact")}
                className="flex items-center gap-2 h-auto p-4"
                variant="outline"
              >
                <MessageCircle className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">Get Help</div>
                  <div className="text-sm text-muted-foreground">Contact support</div>
                </div>
              </Button>
            </div>
            
            <div className="text-center">
              <Button
                onClick={() => window.history.back()}
                variant="ghost"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <h3 className="font-medium mb-2">Popular Features</h3>
              <div className="flex flex-wrap justify-center gap-2 text-sm">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate("/ai-benefits")}
                  className="h-auto p-1"
                >
                  AI Benefits
                </Button>
                <span className="text-muted-foreground">•</span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate("/comparison")}
                  className="h-auto p-1"
                >
                  Feature Comparison
                </Button>
                <span className="text-muted-foreground">•</span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate("/install")}
                  className="h-auto p-1"
                >
                  Install Guide
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
