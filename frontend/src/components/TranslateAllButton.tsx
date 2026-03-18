import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, RefreshCw } from "lucide-react";
import brain from "brain";
import { toast } from "sonner";
import { useLanguageStore } from "utils/languageStore";

interface Language {
  code: string;
  name: string;
}

let cachedLanguages: Language[] | null = null;
let languagesFetchPromise: Promise<Language[]> | null = null;

async function fetchLanguagesCached(): Promise<Language[]> {
  if (cachedLanguages) return cachedLanguages;
  if (languagesFetchPromise) return languagesFetchPromise;
  languagesFetchPromise = (async () => {
    try {
      const res = await brain.get_supported_languages();
      if (res.ok) {
        const data = await res.json();
        cachedLanguages = data.languages as Language[];
      }
    } catch {
      // ignore
    }
    if (!cachedLanguages) {
      cachedLanguages = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' },
        { code: 'zh', name: 'Chinese' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ar', name: 'Arabic' },
      ];
    }
    languagesFetchPromise = null;
    return cachedLanguages!;
  })();
  return languagesFetchPromise;
}

interface TranslateAllButtonProps {
  sessionId: string;
  existingTranslation: { langCode: string } | null;
  onTranslationSaved: (langCode: string, texts: string[]) => void;
}

export function TranslateAllButton({ sessionId, existingTranslation, onTranslationSaved }: TranslateAllButtonProps) {
  const { preferredLanguage } = useLanguageStore();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLang, setSelectedLang] = useState(preferredLanguage || "en");
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    fetchLanguagesCached().then(setLanguages);
  }, []);

  // Sync selectedLang when preferredLanguage loads
  useEffect(() => {
    if (preferredLanguage && !selectedLang) {
      setSelectedLang(preferredLanguage);
    }
  }, [preferredLanguage]);

  const alreadySaved = existingTranslation?.langCode === selectedLang;
  const buttonLabel = isTranslating
    ? "Translating…"
    : alreadySaved
    ? "Re-translate All"
    : "Translate All";

  const handleTranslate = async () => {
    if (!selectedLang) {
      toast.error("Please select a target language.");
      return;
    }

    setIsTranslating(true);
    try {
      const response = await brain.translate_session({
        session_id: sessionId,
        target_language: selectedLang,
      });

      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json().catch(() => ({ detail: "Translation requires an upgrade." }));
          toast.error(errorData.detail || "Translation requires an upgrade.", {
            duration: 6000,
            action: { label: "View Pricing", onClick: () => window.location.href = "/pricing" },
          });
          return;
        }
        const errorData = await response.json().catch(() => ({ detail: "Translation failed." }));
        throw new Error(errorData.detail || "Translation failed.");
      }

      const data = await response.json();
      toast.success(`Translated ${data.segment_count} segments — saved permanently.`);
      onTranslationSaved(selectedLang, data.translations);
    } catch (error: any) {
      toast.error(error?.message || "Translation failed. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mb-3 p-2 bg-muted/40 rounded-md border border-border/60">
      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground">Translate full transcript:</span>
      <Select value={selectedLang} onValueChange={setSelectedLang} disabled={isTranslating}>
        <SelectTrigger className="h-7 text-xs w-36">
          <SelectValue placeholder="Pick language" />
        </SelectTrigger>
        <SelectContent>
          {languages.map((l) => (
            <SelectItem key={l.code} value={l.code}>
              {l.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant={alreadySaved ? "outline" : "default"}
        className="h-7 text-xs"
        onClick={handleTranslate}
        disabled={isTranslating || !selectedLang}
      >
        {isTranslating && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
        {buttonLabel}
      </Button>
      {alreadySaved && (
        <span className="text-xs text-green-600 font-medium">✓ Saved</span>
      )}
    </div>
  );
}
