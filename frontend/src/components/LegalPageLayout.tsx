import React, { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Header } from "components/Header";
import { Helmet } from "react-helmet-async"; // Import Helmet

interface LegalPageLayoutProps {
  title: string;
  metaDescription?: string; // Add metaDescription prop
  helmetContent?: ReactNode; // Prop for additional helmet content like ld+json scripts
  children: ReactNode;
  backTo?: string;
  backLabel?: string;
}

export function LegalPageLayout({ 
  title, 
  metaDescription,
  helmetContent,
  children, 
  backTo = "/", 
  backLabel = "Back to Home" 
}: LegalPageLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>{`${title} - Dicta-Notes`}</title>
        {metaDescription && <meta name="description" content={metaDescription} />}
        {helmetContent} {/* Render additional helmet content here */}
      </Helmet>
      <Header />
      
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
          </div>
          
          <div className="prose prose-sm sm:prose-base max-w-none">
            {children}
          </div>
        </div>
      </main>

      <footer className="py-6 sm:py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:justify-between items-center">
            <div className="mb-4 sm:mb-0">
              <span className="font-semibold">Dicta-Notes</span> © {new Date().getFullYear()} • 
              <span className="text-muted-foreground">
                Dicta-Notes
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
              <a 
                onClick={() => navigate('/Privacy')} 
                href="/Privacy"
                className="text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="View our Privacy Policy"
              >
                Privacy
              </a>
              <a 
                onClick={() => navigate('/Terms')} 
                href="/Terms"
                className="text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="View our Terms of Service"
              >
                Terms
              </a>
              <a 
                onClick={() => navigate('/CookiePolicy')} 
                href="/CookiePolicy"
                className="text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Learn about our Cookie Policy"
              >
                Cookie Policy
              </a>
              <a 
                onClick={() => navigate('/CookieSettings')} 
                href="/CookieSettings"
                className="text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Manage your Cookie Settings"
              >
                Cookie Settings
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
