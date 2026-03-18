import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import brain from "brain";
import { RefreshCw, Languages } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getLanguageName } from "utils/languageUtils";
import { saveTranslationState, loadTranslationState } from "utils/translationPersistence";
import { toast } from "sonner";

interface TranslationControlsProps {
  text: string;
  sourceLanguage: string | undefined;
  targetLanguage?: string;
  colorScheme?: string;
}

interface Language {
  code: string;
  name: string;
}

// Module-scoped cache to avoid racing localStorage across many mounted instances
let cachedPreferredTranslationLanguage: string | null = null;
let hasLoadedPreferredTranslationLanguage = false;

// Module-scoped cache to avoid repeated language list fetches
let cachedSupportedLanguages: Language[] | null = null;
let hasFetchedSupportedLanguages = false;
let fetchLanguagesInFlight: Promise<Language[]> | null = null;

async function getSupportedLanguagesCached(): Promise<Language[]> {
  if (hasFetchedSupportedLanguages && cachedSupportedLanguages) {
    return cachedSupportedLanguages;
  }
  if (fetchLanguagesInFlight) {
    return fetchLanguagesInFlight;
  }
  fetchLanguagesInFlight = (async () => {
    try {
      const response = await brain.get_supported_languages();
      if (response.ok) {
        const data = await response.json();
        cachedSupportedLanguages = data.languages as Language[];
      } else {
        // Fallback
        cachedSupportedLanguages = [
          { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' }, { code: 'fr', name: 'French' },
          { code: 'de', name: 'German' }, { code: 'it', name: 'Italian' }, { code: 'pt', name: 'Portuguese' },
          { code: 'nl', name: 'Dutch' }, { code: 'zh', name: 'Chinese' }, { code: 'ja', name: 'Japanese' },
          { code: 'ko', name: 'Korean' }, { code: 'ru', name: 'Russian' }, { code: 'ar', name: 'Arabic' },
          { code: 'hi', name: 'Hindi' }, { code: 'bn', name: 'Bengali' }, { code: 'pa', name: 'Punjabi' },
          { code: 'ta', name: 'Tamil' }, { code: 'te', name: 'Telugu' }, { code: 'th', name: 'Thai' },
          { code: 'vi', name: 'Vietnamese' }, { code: 'tr', name: 'Turkish' }, { code: 'pl', name: 'Polish' },
          { code: 'uk', name: 'Ukrainian' }, { code: 'id', name: 'Indonesian' }, { code: 'sw', name: 'Swahili' }
        ];
      }
    } catch {
      cachedSupportedLanguages = [
        { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' }, { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' }, { code: 'it', name: 'Italian' }, { code: 'pt', name: 'Portuguese' },
        { code: 'zh', name: 'Chinese' }, { code: 'ja', name: 'Japanese' }, { code: 'ko', name: 'Korean' },
        { code: 'ru', name: 'Russian' }, { code: 'ar', name: 'Arabic' }, { code: 'hi', name: 'Hindi' }
      ];
    } finally {
      hasFetchedSupportedLanguages = true;
      const result = cachedSupportedLanguages!;
      fetchLanguagesInFlight = null;
      return result;
    }
  })();
  return fetchLanguagesInFlight;
}

// Helper function to normalize language codes for comparison
const normalizeLanguageCode = (code: string): string => {
  if (!code) return 'en';
  // Handle auto detection
  if (code === 'auto' || code === 'unknown') return 'auto';
  // Convert to lowercase and take first part (e.g., 'en-US' -> 'en')
  return code.toLowerCase().split('-')[0];
};

// Helper function to check if languages are equivalent
const areLanguagesEquivalent = (lang1: string, lang2: string): boolean => {
  const normalized1 = normalizeLanguageCode(lang1);
  const normalized2 = normalizeLanguageCode(lang2);
  
  // If either is auto, we can't determine equivalence
  if (normalized1 === 'auto' || normalized2 === 'auto') return false;
  
  return normalized1 === normalized2;
};

// Helper function to decode HTML entities from the translation
const decodeHtmlEntities = (text: string): string => {
  // In a browser environment, we can use the DOM to decode entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

export const TranslationControls: React.FC<TranslationControlsProps> = ({
  text,
  sourceLanguage,
  targetLanguage: defaultTargetLang,
  colorScheme = '',
}) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translation, setTranslation] = useState('');
  const [selectedTargetLang, setSelectedTargetLang] = useState("");
  const [supportedLanguages, setSupportedLanguages] = useState<Language[]>([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false);
  const [userLanguage, setUserLanguage] = useState('en');
  const [actualTargetLanguage, setActualTargetLanguage] = useState(defaultTargetLang || 'en');

  // Guard so we only choose defaults once per instance
  const initializedLangSelectionRef = useRef(false);

  // Load persisted translation state on component mount
  useEffect(() => {
    if (text && sourceLanguage) {
      const savedState = loadTranslationState(text, sourceLanguage);
      if (savedState) {
        setTranslation(savedState.translation);
        setShowTranslation(savedState.showTranslation);
        setSelectedTargetLang(savedState.selectedTargetLang);
        setActualTargetLanguage(savedState.selectedTargetLang);
        initializedLangSelectionRef.current = true; // respect restored choice
      }
    }
  }, [text, sourceLanguage]);

  // Save translation state whenever it changes
  useEffect(() => {
    if (text && sourceLanguage && (translation || selectedTargetLang)) {
      saveTranslationState(text, sourceLanguage, {
        translation,
        showTranslation,
        selectedTargetLang
      });
    }
  }, [text, sourceLanguage, translation, showTranslation, selectedTargetLang]);

  // Fetch supported languages when component mounts
  useEffect(() => {
    let cancelled = false;
    const fetchLanguages = async () => {
      try {
        setIsLoadingLanguages(true);
        const langs = await getSupportedLanguagesCached();
        if (!cancelled) {
          setSupportedLanguages(langs);
          // Only set a default if user hasn't chosen and we have no cached preference
          if (!initializedLangSelectionRef.current && !selectedTargetLang && !cachedPreferredTranslationLanguage) {
            const normalizedSource = normalizeLanguageCode(sourceLanguage || 'en');
            const defaultTarget = normalizedSource === 'en' ? 'es' : 'en';
            setSelectedTargetLang(defaultTarget);
          }
        }
      } finally {
        if (!cancelled) setIsLoadingLanguages(false);
      }
    };
    
    fetchLanguages();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceLanguage]);

  // Detect user's browser language on component mount
  useEffect(() => {
    const detectBrowserLanguage = () => {
      const browserLang = navigator.language.split('-')[0] || 'en';
      setUserLanguage(browserLang);
      
      // If no explicit target language was provided and we have no cached pref, pick a sensible default
      if (!defaultTargetLang && !initializedLangSelectionRef.current && !cachedPreferredTranslationLanguage) {
        const normalizedSource = normalizeLanguageCode(sourceLanguage || 'en');
        const normalizedBrowser = normalizeLanguageCode(browserLang);
        
        const targetLang = normalizedBrowser === normalizedSource ? 
          (normalizedSource === 'en' ? 'es' : 'en') : 
          browserLang;
        setActualTargetLanguage(targetLang);
        setSelectedTargetLang(targetLang);
      }
    };
    
    detectBrowserLanguage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultTargetLang, sourceLanguage]);

  // Handle target language selection change
  useEffect(() => {
    if (selectedTargetLang) {
      setActualTargetLanguage(selectedTargetLang);
      // Reset any existing translation when language changes
      setTranslation('');
      setShowTranslation(false);
      
      // Store the selected language in localStorage for persistence (write-through cache)
      try {
        localStorage.setItem('preferredTranslationLanguage', selectedTargetLang);
        cachedPreferredTranslationLanguage = selectedTargetLang;
        hasLoadedPreferredTranslationLanguage = true;
      } catch {
        // ignore storage errors silently
      }
    }
  }, [selectedTargetLang]);
  
  // Load preferred language from localStorage once per page across all instances
  useEffect(() => {
    // If already loaded on this page, reuse cached value
    if (hasLoadedPreferredTranslationLanguage) {
      if (cachedPreferredTranslationLanguage && !initializedLangSelectionRef.current) {
        setSelectedTargetLang(cachedPreferredTranslationLanguage);
        setActualTargetLanguage(cachedPreferredTranslationLanguage);
        initializedLangSelectionRef.current = true;
      }
      return;
    }

    try {
      const savedLanguage = localStorage.getItem('preferredTranslationLanguage');
      if (savedLanguage && savedLanguage !== normalizeLanguageCode(sourceLanguage || '')) {
        cachedPreferredTranslationLanguage = savedLanguage;
        hasLoadedPreferredTranslationLanguage = true;
        if (!initializedLangSelectionRef.current) {
          setSelectedTargetLang(savedLanguage);
          setActualTargetLanguage(savedLanguage);
          initializedLangSelectionRef.current = true;
        }
      } else {
        // Mark as loaded even if nothing present to prevent other instances from racing
        hasLoadedPreferredTranslationLanguage = true;
      }
    } catch {
      // On storage failure, just mark loaded to avoid repeated attempts
      hasLoadedPreferredTranslationLanguage = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check if translation is needed based on language comparison
  const needsTranslation = () => {
    if (!sourceLanguage || sourceLanguage === 'auto' || sourceLanguage === 'unknown') {
      return true; // Always show for auto-detected languages
    }
    
    const targetLang = selectedTargetLang || actualTargetLanguage;
    return !areLanguagesEquivalent(sourceLanguage, targetLang);
  };
  
  // Only show translation controls when languages differ or source is auto-detected
  if (!needsTranslation() && sourceLanguage !== 'auto' && sourceLanguage !== 'unknown') {
    return (
      <div className="text-xs text-gray-500 italic">
        Already in {getLanguageName(sourceLanguage)}
      </div>
    );
  }
  
  // Exit early if no source language
  if (!sourceLanguage) {
    return null;
  }
  
  const handleTranslate = async () => {
    // If we already have a translation, just toggle visibility
    if (translation && showTranslation) {
      setShowTranslation(false);
      return;
    } else if (translation) {
      setShowTranslation(true);
      return;
    }
    
    // Validate input
    if (!text || !text.trim()) {
      return;
    }
    
    if (!sourceLanguage) {
      return;
    }
    
    // Handle 'auto' source language by letting Gemini auto-detect
    let actualSourceLanguage = sourceLanguage;
    if (sourceLanguage === 'auto' || sourceLanguage === 'unknown') {
      actualSourceLanguage = undefined as any; // Let Gemini auto-detect
    }
    
    setIsTranslating(true);
    
    try {
      const targetLang = selectedTargetLang || actualTargetLanguage;
      if (!targetLang) {
        throw new Error('No target language selected');
      }
      
      if (areLanguagesEquivalent(sourceLanguage, targetLang)) {
        setTranslation(text);
        setShowTranslation(true);
        return;
      }
      
      // Clear any previous translation
      setTranslation('');
      
      const requestData = {
        text: text,
        source_language: actualSourceLanguage, // Use the validated source language
        target_language: targetLang
      };
      
      const response = await brain.translate_text(requestData);
      
      if (!response.ok) {
        // Check if it's a tier restriction (403)
        if (response.status === 403) {
          const errorData = await response.json().catch(() => ({ 
            detail: "Translation is not available on your plan." 
          }));
          
          toast.error(
            errorData.detail || "Translation requires an upgrade.",
            { 
              duration: 6000,
              action: {
                label: "View Pricing",
                onClick: () => window.location.href = "/pricing"
              }
            }
          );
          return;
        }
        
        // Other errors
        const errorText = await response.text();
        throw new Error(`Translation failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data.translated_text) {
        const translatedText = data.translated_text;
        setTranslation(decodeHtmlEntities(translatedText));
        setShowTranslation(true);
        
        // Save the translation state immediately
        saveTranslationState(text, sourceLanguage, {
          translation: decodeHtmlEntities(translatedText),
          showTranslation: true,
          selectedTargetLang: targetLang
        });
      } else {
        throw new Error('No translated text in response');
      }
    } catch (error: any) {
      const msg = error?.detail || error?.message || String(error);
      setTranslation(`Translation failed: ${msg}`);
      setShowTranslation(true);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleHideTranslation = () => {
    setShowTranslation(false);
  };
  
  // Revert to original language after translation
  const revertToOriginal = () => {
    setShowTranslation(false);
    setTranslation('');
    // Reset language selection to English unless source is already English
    const normalizedSource = normalizeLanguageCode(sourceLanguage || 'en');
    const defaultTarget = normalizedSource === 'en' ? 'es' : 'en';
    setSelectedTargetLang(defaultTarget);
    setActualTargetLanguage(defaultTarget);
  };

  // Class names based on color scheme
  let borderColorClass = 'border-primary';
  
  if (colorScheme === 'blue') {
    borderColorClass = 'border-blue-300';
  } else if (colorScheme === 'green') {
    borderColorClass = 'border-green-300';
  } else if (colorScheme === 'purple') {
    borderColorClass = 'border-purple-300';
  } else if (colorScheme === 'amber') {
    borderColorClass = 'border-amber-300';
  } else if (colorScheme === 'rose') {
    borderColorClass = 'border-rose-300';
  }

  // Create a dynamic translation button label
  const translationLabel = `Translate to ${getLanguageName(actualTargetLanguage)}`;
  
  // Add a tooltip explaining the translation will use browser language
  const tooltipText = `Translates using your browser language settings (${getLanguageName(userLanguage)}). Change your browser language to update this preference.`;

  return (
    <div className="flex flex-col">
      <div className="flex items-center mb-2 space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={handleTranslate} 
                size="sm" 
                variant="outline" 
                className={`text-xs flex items-center ${isTranslating ? 'opacity-70' : ''}`}
                disabled={isTranslating}
              >
                {isTranslating ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Languages className="h-3 w-3 mr-1" />
                )}
                {showTranslation ? "Hide Translation" : "Translate"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Translate this text</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {!showTranslation && (
          <Select
            value={selectedTargetLang}
            onValueChange={setSelectedTargetLang}
            disabled={isLoadingLanguages || isTranslating}
          >
            <SelectTrigger className="h-8 text-xs w-32">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages
                .map(language => (
                  <SelectItem key={language.code} value={language.code}>
                    {language.name}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        )}
        
        {showTranslation && (
          <Button
            onClick={revertToOriginal}
            size="sm"
            variant="ghost"
            className="text-xs flex items-center"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Original
          </Button>
        )}
      </div>
      
      {showTranslation && translation && (
        <div className="text-sm bg-gray-50 p-2 rounded border border-gray-200 mb-3">
          <p>{translation}</p>
        </div>
      )}
    </div>
  );
};
