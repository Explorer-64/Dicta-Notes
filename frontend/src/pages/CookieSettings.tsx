import React, { useState, useEffect } from "react";
import { LegalPageLayout } from "components/LegalPageLayout";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function CookieSettings() {
  const navigate = useNavigate();
  const pageTitle = "Cookie Settings";
  const metaDescription = "Manage your cookie preferences for Dicta-Notes. Control analytics, functional, and performance cookies to tailor your experience.";
  
  // Cookie preference states
  const [essentialCookies] = useState(true); // Always enabled
  const [analyticsCookies, setAnalyticsCookies] = useState(true);
  const [functionalCookies, setFunctionalCookies] = useState(true);
  const [performanceCookies, setPerformanceCookies] = useState(true);
  
  const breadcrumbSchema = {
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
        "name": pageTitle,
        "item": "https://dicta-notes.com/CookieSettings"
      }
    ]
  };

  // Load saved preferences on component mount
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem('cookiePreferences');
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        setAnalyticsCookies(preferences.analytics);
        setFunctionalCookies(preferences.functional);
        setPerformanceCookies(preferences.performance);
      }
    } catch (error) {
      console.error('Error loading cookie preferences:', error);
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = () => {
    const preferences = {
      analytics: analyticsCookies,
      functional: functionalCookies,
      performance: performanceCookies
    };
    
    try {
      localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
      toast.success("Cookie preferences saved successfully");
    } catch (error) {
      console.error('Error saving cookie preferences:', error);
      toast.error("Failed to save preferences");
    }
  };

  // Accept all cookies
  const acceptAll = () => {
    setAnalyticsCookies(true);
    setFunctionalCookies(true);
    setPerformanceCookies(true);
    
    const preferences = {
      analytics: true,
      functional: true,
      performance: true
    };
    
    try {
      localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
      toast.success("All cookies accepted");
    } catch (error) {
      console.error('Error saving cookie preferences:', error);
      toast.error("Failed to save preferences");
    }
  };

  // Reject optional cookies
  const rejectOptional = () => {
    setAnalyticsCookies(false);
    setFunctionalCookies(false);
    setPerformanceCookies(false);
    
    const preferences = {
      analytics: false,
      functional: false,
      performance: false
    };
    
    try {
      localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
      toast.success("Optional cookies rejected");
    } catch (error) {
      console.error('Error saving cookie preferences:', error);
      toast.error("Failed to save preferences");
    }
  };

  return (
    <LegalPageLayout 
      title={pageTitle} 
      metaDescription={metaDescription}
      backTo="/CookiePolicy" 
      backLabel="Back to Cookie Policy"
      helmetContent={
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      }
    >
      <section className="mb-8">
        <p className="mb-4">
          Manage your cookie preferences below. Essential cookies cannot be disabled as they are necessary 
          for the website to function properly.
        </p>
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-6">
          <Button onClick={acceptAll} className="flex-1">Accept All Cookies</Button>
          <Button variant="outline" onClick={rejectOptional} className="flex-1">Reject Optional Cookies</Button>
        </div>
      </section>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Essential Cookies - always enabled */}
            <div className="flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Essential Cookies</Label>
                <p className="text-muted-foreground text-sm">
                  Required for the website to function. Cannot be disabled.
                </p>
              </div>
              <Switch checked={essentialCookies} disabled />
            </div>

            {/* Analytics Cookies */}
            <div className="flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Analytics Cookies</Label>
                <p className="text-muted-foreground text-sm">
                  Help us understand how visitors use our website.
                </p>
              </div>
              <Switch 
                checked={analyticsCookies} 
                onCheckedChange={setAnalyticsCookies} 
                aria-label="Toggle analytics cookies"
              />
            </div>

            {/* Functional Cookies */}
            <div className="flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Functional Cookies</Label>
                <p className="text-muted-foreground text-sm">
                  Enable enhanced functionality and personalization.
                </p>
              </div>
              <Switch 
                checked={functionalCookies} 
                onCheckedChange={setFunctionalCookies} 
                aria-label="Toggle functional cookies"
              />
            </div>

            {/* Performance Cookies */}
            <div className="flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Performance Cookies</Label>
                <p className="text-muted-foreground text-sm">
                  Collect information about how you use our website.
                </p>
              </div>
              <Switch 
                checked={performanceCookies} 
                onCheckedChange={setPerformanceCookies} 
                aria-label="Toggle performance cookies"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mb-8">
        <Button onClick={savePreferences}>Save Preferences</Button>
      </div>

      <section className="mb-8">
        <h2>More Information</h2>
        <p className="mb-4">
          For more information about the cookies we use, please visit our <span onClick={() => navigate('/CookiePolicy')} className="text-primary hover:underline cursor-pointer">Cookie Policy</span>.
        </p>
        <p>
          If you have any questions or concerns about our use of cookies, please contact us at privacy@dicta-notes.com.
        </p>
      </section>
    </LegalPageLayout>
  );
}
