import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import brain from "brain";
import { useCurrentUser } from "app";
import { useLanguageStore } from "utils/languageStore";
import { getBrowserLanguage, getNativeLanguageName } from "utils/uiInternationalization";

export interface Props {
  className?: string;
}

type Language = {
  code: string;
  name: string;
};

export const LanguageSettingsSection: React.FC<Props> = ({ className = "" }) => {
  const { user } = useCurrentUser();
  const { preferredLanguage, setPreferredLanguage, isInitialized } = useLanguageStore();

  const [supportedLanguages, setSupportedLanguages] = useState<Language[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string>(preferredLanguage || "en");

  // Keep local selected in sync if store changes externally
  useEffect(() => {
    if (preferredLanguage && preferredLanguage !== selected) {
      setSelected(preferredLanguage);
    }
  }, [preferredLanguage]);

  // Localized display name using browser language, with native-name fallback
  const getLanguageDisplayName = (code: string): string => {
    try {
      const browserLang = getBrowserLanguage();
      const displayNames = new Intl.DisplayNames([browserLang], { type: "language" });
      const displayName = displayNames.of(code);
      if (!displayName) return getNativeLanguageName(code);
      return displayName.charAt(0).toUpperCase() + displayName.slice(1);
    } catch (e) {
      return getNativeLanguageName(code);
    }
  };

  // Fetch supported languages (with simple fallback)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoadingLanguages(true);
      try {
        const res = await brain.get_supported_languages();
        if (res.ok) {
          const data = await res.json();
          const langs = (data.languages as Language[]).slice().sort((a, b) => a.name.localeCompare(b.name));
          if (!cancelled) setSupportedLanguages(langs);
        } else {
          throw new Error("Failed to load supported languages");
        }
      } catch {
        const fallback: Language[] = [
          { code: "en", name: "English" },
          { code: "es", name: "Spanish" },
          { code: "fr", name: "French" },
          { code: "de", name: "German" },
          { code: "zh", name: "Chinese" },
          { code: "ja", name: "Japanese" },
          { code: "ko", name: "Korean" },
          { code: "ar", name: "Arabic" },
          { code: "ru", name: "Russian" },
          { code: "pt", name: "Portuguese" },
          { code: "hi", name: "Hindi" },
        ];
        if (!cancelled) setSupportedLanguages(fallback);
      } finally {
        if (!cancelled) setLoadingLanguages(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const browserLanguageName = useMemo(() => getLanguageDisplayName(getBrowserLanguage()), []);
  const currentPrefName = useMemo(() => getLanguageDisplayName(preferredLanguage || "en"), [preferredLanguage]);

  const handleSave = async () => {
    if (!selected || selected === preferredLanguage) return;
    setSaving(true);
    try {
      await setPreferredLanguage(selected, user);
      toast.success(`Preferred language set to ${getLanguageDisplayName(selected)}`);
    } catch (e) {
      toast.error("Failed to save language preference");
    } finally {
      setSaving(false);
    }
  };

  const setEnglish = async () => {
    if (preferredLanguage === "en") return;
    setSaving(true);
    try {
      await setPreferredLanguage("en", user);
      toast.success("Preferred language set to English");
    } catch {
      toast.error("Failed to update language");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Language Preferences</CardTitle>
        <CardDescription>
          Choose your preferred language for translations across Dicta-Notes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Current preference:</span>
          <Badge variant="secondary">{currentPrefName}</Badge>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="min-w-64">
            <label className="text-sm block mb-1">Select language</label>
            <Select
              value={selected}
              onValueChange={setSelected}
              disabled={loadingLanguages || saving}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {supportedLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {getLanguageDisplayName(lang.code)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || selected === preferredLanguage}>
              {saving ? "Saving..." : "Save Preference"}
            </Button>
            <Button variant="outline" onClick={setEnglish} disabled={saving || preferredLanguage === "en"}>
              Use English
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Your browser language is detected as <span className="font-medium">{browserLanguageName}</span>. 
          Pages may auto-translate based on this preference after you save.
        </div>
      </CardContent>
    </Card>
  );
};
