import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Globe, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import brain from "brain";
import { useLocation } from "react-router-dom";
import { useLanguageStore } from "../utils/languageStore";
import { useCurrentUser } from "app";
import { useMediaQuery } from "../utils/useMediaQuery";
import { checkTranslationCache, saveToTranslationCache } from "../utils/translationCache";
import { sha256 } from "../utils/hashUtils";
import { useLocalizedText } from '../utils/localizedUIText';
import { getNativeLanguageName, getBrowserLanguage } from '../utils/uiInternationalization';

interface Props {
  buttonVariant?: 'default' | 'secondary' | 'outline' | 'ghost';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

type Language = {
  code: string;
  name: string;
};

// This function will be populated by the component to update its state
// It's a bit of a hack, but avoids complex context setup for a single function
let translationTriggerFn: (() => void) | null = null;

// Global singleton to prevent multiple language fetches
let globalLanguages: Language[] = [];
let isGloballyFetching = false;
let globalFetchPromise: Promise<Language[]> | null = null;

export const triggerPageTranslation = () => {
  // This triggers a re-translation of the entire page
  translationTriggerFn?.();
};

/**
 * Call this function after dynamic content has been updated
 * to translate it if a non-English language is selected
 */
export const triggerContentTranslation = () => {
  // Only triggers if we already have a non-English language active
  const currentLang = document.documentElement.getAttribute('lang');
  if (currentLang && currentLang !== 'en') {
    translationTriggerFn?.();
  }
};

// Export the context
export const GlobalTranslationContext = createContext<{
  triggerTranslation: () => void;
  currentLanguage: string | null;
}>({ 
  triggerTranslation: () => {}, 
  currentLanguage: null 
});

// Custom hook to use the translation context
export const useTranslation = () => useContext(GlobalTranslationContext);

export function GlobalTranslation({
  buttonVariant = 'outline',
  buttonSize = 'default',
  className = ''
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const { preferredLanguage, setPreferredLanguage } = useLanguageStore();
  const [targetLanguage, setTargetLanguage] = useState(preferredLanguage);
  const { user } = useCurrentUser();
  const [supportedLanguages, setSupportedLanguages] = useState<Language[]>([]);
  // Browser language detection for future auto-translation feature
  const [browserLanguage, setBrowserLanguage] = useState('en');
  const [isPageTranslated, setIsPageTranslated] = useState(false);
  // Store original nodes and content for potential reverting
  const [originalTextNodes, setOriginalTextNodes] = useState<{node: Text, content: string}[]>([]);
  // Also track marked elements (with data-translate attribute)
  const [originalMarkedElements, setOriginalMarkedElements] = useState<{element: Element, content: string}[]>([]);
  const [currentTranslatedLanguage, setCurrentTranslatedLanguage] = useState<string | null>(null);
  const [previousLanguage, setPreviousLanguage] = useState<string>('en');
  // Using a counter to force re-translation when needed
  const [translationTrigger, setTranslationTrigger] = useState(0);
  const [shouldAutoTranslate, setShouldAutoTranslate] = useState(false);
  const location = useLocation();
  // Screen size detection for potential responsive adjustments
  const _isSmallScreen = useMediaQuery('(max-width: 640px)');
  const { getText } = useLocalizedText();

  const getLanguageName = (code: string): string => {
    // Use native language names for better UX
    return getNativeLanguageName(code);
  };

  const getLanguageDisplayName = (code: string): string => {
    try {
      const browserLang = getBrowserLanguage();
      const displayNames = new Intl.DisplayNames([browserLang], { type: 'language' });
      // Capitalize the first letter for consistency
      const displayName = displayNames.of(code);
      if (!displayName) return getNativeLanguageName(code); // Fallback
      return displayName.charAt(0).toUpperCase() + displayName.slice(1);
    } catch (e) {
      console.error("Error getting display name for language:", e);
      // Fallback to native name on error
      return getNativeLanguageName(code);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
  };

  const GlobalSelectStyle = () => (
    <style>{`
      [data-radix-select-viewport] {
        -webkit-overflow-scrolling: touch;
        touch-action: pan-y;
      }
    `}</style>
  );

  // Helper function to get translated text (with caching)
  const getTranslatedText = async (textContent: string, targetLanguage: string): Promise<string> => {
    if (!textContent.trim()) {
      return '';
    }
    
    // Cache check block
    try {
      const pagePath = location.pathname;
      
      // Try localStorage cache first for non-authenticated users
      if (!user) {
        const localCacheStr = localStorage.getItem('translation-cache');
        if (localCacheStr) {
          try {
            const localCache = JSON.parse(localCacheStr);
            // Generate cache key
            const contentHash = await sha256(textContent);
            const cacheKey = `${pagePath}-${targetLanguage}-${contentHash}`;
            
            if (localCache[cacheKey] && 
                Date.now() - localCache[cacheKey].timestamp <= 24 * 60 * 60 * 1000) {
              console.log('Using localStorage translation cache');
              return localCache[cacheKey].translatedContent;
            }
          } catch (parseError) {
            console.error('Error parsing localStorage cache:', parseError);
          }
        }
      }
      
      // Check Firestore cache
      const cachedTranslation = await checkTranslationCache(pagePath, targetLanguage, textContent);
      if (cachedTranslation) {
        console.log('Using Firestore translation cache');
        return cachedTranslation.translatedContent;
      }
      
      // No cache hit, call translation API
      console.log('Cache miss in GlobalTranslation, calling translation API');
      const response = await brain.translate_text({
        text: textContent,
        target_language: targetLanguage
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`);
      }

      const result = await response.json();
      const translatedText = result.translated_text;
      
      // Save to cache
      await saveToTranslationCache(pagePath, targetLanguage, textContent, translatedText);
      
      return translatedText;
    } catch (error) {
      console.error('Error with translation cache or API:', error);
      throw error;
    }
  };

  // Revert to original language
  const revertToOriginal = useCallback(() => {
    // Revert marked elements (data-translate)
    if (originalMarkedElements.length > 0) {
      originalMarkedElements.forEach(item => {
        item.element.textContent = item.content;
      });
    }

    // Revert regular text nodes
    if (originalTextNodes.length > 0) {
      originalTextNodes.forEach(item => {
        item.node.textContent = item.content;
      });
    }
    
    // Reset state
    setIsPageTranslated(false);
    setOriginalTextNodes([]);
    setOriginalMarkedElements([]);
    setCurrentTranslatedLanguage(null);

    // Restore the lang attribute to whatever it was before translation
    document.documentElement.setAttribute('lang', previousLanguage);

    // Restore session lang to previous language so navigation auto-translates correctly
    if (previousLanguage && previousLanguage !== 'en') {
      sessionStorage.setItem('session_translation_lang', previousLanguage);
    } else {
      sessionStorage.removeItem('session_translation_lang');
    }

    const revertLabel = previousLanguage !== 'en'
      ? `Reverted to ${getLanguageName(previousLanguage)}`
      : 'Reverted to original';
    toast.success(revertLabel);
  }, [originalMarkedElements, originalTextNodes, previousLanguage, getLanguageName]);

  // Handle the actual translation of the page content
  const handleTranslatePage = useCallback(async () => {
    try {
      setIsTranslating(true);

      // Capture the language the page is currently in before we overwrite it
      const langBeforeTranslation = document.documentElement.getAttribute('lang') || 'en';
      setPreviousLanguage(langBeforeTranslation);

      // FIRST PASS: Translate elements with data-translate attribute
      // Find all elements with data-translate attribute
      const markedElements = document.querySelectorAll('[data-translate]');
      const markedOriginals: {element: Element, content: string}[] = [];
      
      // Skip if no marked elements found
      let markedText = '';
      if (markedElements.length > 0) {
        // Extract text from marked elements
        markedText = Array.from(markedElements)
          .map(el => {
            const content = el.textContent || '';
            // Store original content
            markedOriginals.push({
              element: el,
              content: content
            });
            return content;
          })
          .filter(text => text.trim() !== '') // Filter out empty strings
          .join('\n\n');
      }
      
      // Translate marked elements if we have any
      if (markedText.trim()) {
        const translatedMarkedText = await getTranslatedText(markedText, targetLanguage);
        
        // Apply translations to marked elements
        const translatedChunks = translatedMarkedText.split('\n\n');
        let chunkIndex = 0;
        
        markedElements.forEach((element) => {
          const content = element.textContent?.trim();
          if (content && translatedChunks[chunkIndex]) {
            element.textContent = translatedChunks[chunkIndex];
            chunkIndex++;
          }
        });
      }
      
      // SECOND PASS: Use DOM walker for broader coverage
      // Store original nodes and content for potential reverting
      const originalNodes: {node: Text, content: string}[] = [];
      
      // Create a walker to extract text nodes from the DOM
      const textNodes: Text[] = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function(node) {
            // Skip script and style tags
            if (node.parentNode?.nodeName === 'SCRIPT' || 
                node.parentNode?.nodeName === 'STYLE' ||
                node.parentNode?.nodeName === 'NOSCRIPT' ||
                node.textContent?.trim() === '') {
              return NodeFilter.FILTER_REJECT;
            }

            // Skip nodes that are children of elements with data-translate
            // as these have already been translated in the first pass
            let parent = node.parentNode as Element;
            while (parent && parent !== document.body) {
              if (parent.hasAttribute('data-translate')) {
                return NodeFilter.FILTER_REJECT;
              }
              parent = parent.parentNode as Element;
            }
            
            // Check if the node is part of a tab trigger (for tabs like Overview, Members, Sessions)
            const parentElement = node.parentNode as Element;
            const grandparentElement = parentElement?.parentNode as Element;
            const greatGrandparentElement = grandparentElement?.parentNode as Element;
            
            const isTabElement = (
              parentElement?.className?.includes('TabsTrigger') ||
              grandparentElement?.className?.includes('TabsTrigger') ||
              greatGrandparentElement?.className?.includes('TabsTrigger') ||
              parentElement?.nodeName === 'BUTTON' && grandparentElement?.className?.includes('TabsList')
            );
            
            // Check if this is a button or inside a button with data-translate
            const isButton = (
              parentElement?.nodeName === 'BUTTON' ||
              parentElement?.tagName === 'BUTTON' ||
              grandparentElement?.nodeName === 'BUTTON' ||
              grandparentElement?.tagName === 'BUTTON' ||
              // Button wrapper span - often contains the button text
              (parentElement?.nodeName === 'SPAN' && grandparentElement?.nodeName === 'BUTTON')
            );
            
            // Prioritize labels and field names
            // Company Profile field labels have specific patterns we target here
            const isFormLabel = (
              parentElement?.nodeName === 'LABEL' ||
              grandparentElement?.nodeName === 'LABEL' ||
              // Company profile field headings
              parentElement?.className?.includes('text-sm font-medium') ||
              // Section headings in profile pages
              parentElement?.className?.includes('text-base font-medium') ||
              // Any font-medium element which typically contains field names
              parentElement?.className?.includes('font-medium') ||
              // Direct heading elements
              parentElement?.nodeName === 'H3' ||
              parentElement?.nodeName === 'H4' ||
              // Dialog field labels and card descriptions
              parentElement?.className?.includes('text-right') ||
              parentElement?.className?.includes('card-description') ||
              // Button text - now using the more comprehensive isButton check
              isButton ||
              // Card titles and form labels
              parentElement?.className?.includes('CardTitle') ||
              // Company details page tab elements
              isTabElement
            );

            if (isFormLabel) {
              return NodeFilter.FILTER_ACCEPT;
            }
            
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );
      
      // Collect all text nodes
      let node:any
      while (node = walker.nextNode()) {
        const textNode = node as Text;
        textNodes.push(textNode);
        // Store original content
        originalNodes.push({
          node: textNode,
          content: textNode.textContent || ''
        });
      }
      
      // Extract the text content from all nodes
      const textContent = textNodes.map(node => node.textContent).join('\n\n');
      
      if (textContent.trim()) {
        // Translate the general text content
        const translatedText = await getTranslatedText(textContent, targetLanguage);
        
        // Split the translated text into chunks matching the original nodes
        const translatedChunks = translatedText.split('\n\n');
        
        // Apply translations to nodes (up to the number of chunks we have)
        const maxNodes = Math.min(textNodes.length, translatedChunks.length);
        for (let i = 0; i < maxNodes; i++) {
          if (translatedChunks[i] && translatedChunks[i].trim()) {
            textNodes[i].textContent = translatedChunks[i];
          }
        }
      }
      
      // Save original nodes for possible reversion
      setOriginalTextNodes(originalNodes);
      setOriginalMarkedElements(markedOriginals);
      setIsPageTranslated(true);
      setCurrentTranslatedLanguage(targetLanguage);
      
      // Update language attribute on html element
      document.documentElement.setAttribute('lang', targetLanguage);
      
      // No longer auto-save as preferred language
      // User must explicitly click 'Save as Preferred' button

      // Update current translated language tracking
      setCurrentTranslatedLanguage(targetLanguage);
      
      // Persist session translation so it survives page navigation
      sessionStorage.setItem('session_translation_lang', targetLanguage);

      // On success, show a success message only if this was a manual translation (dialog was open)
      if (isOpen) {
        toast.success(`Page translated to ${getLanguageName(targetLanguage)}`);
      }
      
      // Close the dialog
      setIsOpen(false);
    } catch (error) {
      console.error('Translation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to translate page');
    } finally {
      setIsTranslating(false);
    }
  }, [targetLanguage, user, isOpen, getLanguageName, getTranslatedText, setPreferredLanguage]);
  
  // Translate the entire page content (button click handler)
  const translatePage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    // If already translated, show revert option and revert to English
    if (isPageTranslated) {
      revertToOriginal();
      return;
    }
    
    // Always show the dialog regardless of screen size
    setIsOpen(true);
  }, [isPageTranslated, revertToOriginal]);

  // Enhanced translation trigger function that supports both initial loads and dynamic updates
  // Must be defined AFTER the functions it depends on
  const triggerTranslation = useCallback(() => {
    if (currentTranslatedLanguage) {
      console.log('Manually triggering translation for dynamic content');
      // Save the current language
      const savedLanguage = currentTranslatedLanguage;
      // First revert to original
      revertToOriginal();
      // Then retranslate with a short delay to ensure DOM is updated
      setTimeout(() => {
        // Use the saved language to re-translate
        setTargetLanguage(savedLanguage);
        handleTranslatePage();
      }, 100);
    }
  }, [currentTranslatedLanguage, revertToOriginal, handleTranslatePage, setTargetLanguage]);
  
  // Update the global trigger function
  useEffect(() => {
    translationTriggerFn = triggerTranslation;
    return () => {
      translationTriggerFn = null;
    };
  }, [triggerTranslation]);

  // On route change: reset stale DOM refs and auto-retranslate if session lang is active
  useEffect(() => {
    // Always reset — old text node refs are stale after navigation
    setIsPageTranslated(false);
    setOriginalTextNodes([]);
    setOriginalMarkedElements([]);
    setCurrentTranslatedLanguage(null);
    document.documentElement.setAttribute('lang', 'en');

    // Priority: active session lang → saved preferred language
    const sessionLang = sessionStorage.getItem('session_translation_lang');
    const activeLang = (sessionLang && sessionLang !== 'en')
      ? sessionLang
      : (preferredLanguage && preferredLanguage !== 'en' ? preferredLanguage : null);

    if (activeLang) {
      setTargetLanguage(activeLang);
      // Sync sessionStorage so subsequent navigations don't re-check preferredLanguage
      sessionStorage.setItem('session_translation_lang', activeLang);
      setShouldAutoTranslate(true);
    }
  }, [location.pathname, preferredLanguage]);

  // Auto-translate effect: fires after targetLanguage is updated by the route-change effect
  useEffect(() => {
    if (!shouldAutoTranslate) return;
    setShouldAutoTranslate(false);
    const timer = setTimeout(() => {
      handleTranslatePage();
    }, 300);
    return () => clearTimeout(timer);
  }, [shouldAutoTranslate, handleTranslatePage]);
  
  // Update targetLanguage when preferredLanguage changes
  useEffect(() => {
    if (preferredLanguage && targetLanguage !== preferredLanguage) {
      // This synchronization should only happen when the user's preference changes,
      // not every time the targetLanguage is updated internally.
      // setTargetLanguage(preferredLanguage);
    }
  }, [preferredLanguage]);
  
  // Fetch supported languages when component mounts
  useEffect(() => {
    let isMounted = true;

    const fetchLanguages = async () => {
      try {
        // Use global singleton to prevent multiple fetches
        if (globalLanguages.length > 0) {
          setSupportedLanguages(globalLanguages);
          return;
        }
        
        if (isGloballyFetching) {
          // Wait for existing fetch to complete
          if (globalFetchPromise) {
            const languages = await globalFetchPromise;
            if (isMounted) setSupportedLanguages(languages);
          }
          return;
        }
        
        // Start global fetch
        isGloballyFetching = true;
        globalFetchPromise = (async () => {
          // Check if we already have languages cached
          const cachedLangs = localStorage.getItem('supported-languages-cache');
          if (cachedLangs) {
            try {
              const parsedLangs = JSON.parse(cachedLangs);
              // Check if cache is still valid (less than 24 hours old)
              if (parsedLangs && 
                  parsedLangs.timestamp && 
                  Date.now() - parsedLangs.timestamp < 24 * 60 * 60 * 1000) {
                globalLanguages = parsedLangs.languages;
                return globalLanguages;
              }
            } catch (err) {
              console.log('Error parsing cached languages, fetching fresh data');
              // Continue with API call if cache parsing fails
            }
          }
          
          // Fetch languages from API with timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
          
          try {
            const response = await brain.get_supported_languages({
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const data = await response.json();
              // Sort languages alphabetically by name
              const sortedLanguages = [...data.languages].sort((a, b) => a.name.localeCompare(b.name));
              globalLanguages = sortedLanguages;
              
              // Cache the languages
              localStorage.setItem('supported-languages-cache', JSON.stringify({
                languages: sortedLanguages,
                timestamp: Date.now()
              }));
              return globalLanguages;
            }
          } catch (apiError) {
            clearTimeout(timeoutId);
            // Silently handle API errors (like 401) and use fallback
            console.log('Languages API not available, using fallback');
          }
          
          // Use fallback languages if API fails or is not accessible
          const fallbackLanguages = [
            { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' }, { code: 'fr', name: 'French' },
            { code: 'de', name: 'German' }, { code: 'it', name: 'Italian' }, { code: 'pt', name: 'Portuguese' },
            { code: 'nl', name: 'Dutch' }, { code: 'ja', name: 'Japanese' }, { code: 'ko', name: 'Korean' },
            { code: 'zh', name: 'Chinese' }, { code: 'ru', name: 'Russian' }, { code: 'ar', name: 'Arabic' },
            { code: 'hi', name: 'Hindi' }, { code: 'bn', name: 'Bengali' }, { code: 'pa', name: 'Punjabi' },
            { code: 'ta', name: 'Tamil' }, { code: 'te', name: 'Telugu' }, { code: 'th', name: 'Thai' },
            { code: 'vi', name: 'Vietnamese' }, { code: 'tr', name: 'Turkish' }, { code: 'pl', name: 'Polish' },
            { code: 'uk', name: 'Ukrainian' }, { code: 'sv', name: 'Swedish' }, { code: 'id', name: 'Indonesian' },
            { code: 'ms', name: 'Malay' }, { code: 'sw', name: 'Swahili' }, { code: 'am', name: 'Amharic' },
            { code: 'yo', name: 'Yoruba' }, { code: 'zu', name: 'Zulu' }
          ];
          
          globalLanguages = fallbackLanguages;
          
          // Still cache these fallback languages so we don't need to make the API call again
          localStorage.setItem('supported-languages-cache', JSON.stringify({
            languages: fallbackLanguages,
            timestamp: Date.now()
          }));
          
          return globalLanguages;
        })();
        
        const languages = await globalFetchPromise;
        if (isMounted) setSupportedLanguages(languages);
        
      } catch (error) {
        if (!isMounted) return;
        
        // Quietly handle all errors including timeouts and 401s
        if (error.name === 'AbortError') {
          console.log('Language fetch request timed out, using fallback languages');
        } else {
          // Don't log errors for auth issues, just use fallback
          console.log('Languages API not available, using fallback languages');
        }
        
        // Use fallback languages
        const fallbackLanguages = [
          { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' }, { code: 'fr', name: 'French' },
          { code: 'de', name: 'German' }, { code: 'it', name: 'Italian' }, { code: 'pt', name: 'Portuguese' },
          { code: 'nl', name: 'Dutch' }, { code: 'ja', name: 'Japanese' }, { code: 'ko', name: 'Korean' },
          { code: 'zh', name: 'Chinese' }, { code: 'ru', name: 'Russian' }, { code: 'ar', name: 'Arabic' },
          { code: 'hi', name: 'Hindi' }, { code: 'bn', name: 'Bengali' }, { code: 'pa', name: 'Punjabi' },
          { code: 'ta', name: 'Tamil' }, { code: 'te', name: 'Telugu' }, { code: 'th', name: 'Thai' },
          { code: 'vi', name: 'Vietnamese' }, { code: 'tr', name: 'Turkish' }, { code: 'pl', name: 'Polish' },
          { code: 'uk', name: 'Ukrainian' }, { code: 'sv', name: 'Swedish' }, { code: 'id', name: 'Indonesian' },
          { code: 'ms', name: 'Malay' }, { code: 'sw', name: 'Swahili' }, { code: 'am', name: 'Amharic' },
          { code: 'yo', name: 'Yoruba' }, { code: 'zu', name: 'Zulu' }
        ];
        setSupportedLanguages(fallbackLanguages);
        globalLanguages = fallbackLanguages;
      } finally {
        isGloballyFetching = false;
        globalFetchPromise = null;
      }
    };

    fetchLanguages();

    return () => {
      isMounted = false;
    };
  }, []);
  
  // Save language preference when user selects a language
  const handleLanguageChange = async (language: string) => {
    console.log(`handleLanguageChange called with language: ${language}`);
    console.log(`Current state - targetLanguage: ${targetLanguage}, preferredLanguage: ${preferredLanguage}`);
    
    // Don't save preference if it's the same as current
    if (language === preferredLanguage) {
      console.log(`Language ${language} is already the preferred language, skipping save`);
      return;
    }
    
    try {
      // Persist the language preference to Firebase
      console.log(`Saving language preference to Firebase: ${language}`);
      // Use the store's method to save to Firebase
      await setPreferredLanguage(language, user);
      console.log(`Language preference saved to Firebase`);
      
      // Show confirmation toast
      console.log(`Language preference changed from ${preferredLanguage} to ${language}, showing toast`);
      toast.success(`Set preferred language to ${getLanguageName(language)}`);
    } catch (error) {
      console.error('Failed to save language preference:', error);
      toast.error('Failed to save language preference');
    }
  };

  return (
    <GlobalTranslationContext.Provider value={{ 
      triggerTranslation, 
      currentLanguage: currentTranslatedLanguage 
    }}>
      <GlobalSelectStyle />
      <Dialog open={isOpen} onOpenChange={handleDialogChange}>
        <DialogTrigger asChild>
          <Button 
            variant={buttonVariant} 
            size={buttonSize} 
            className={`flex items-center ${className}`}
            onClick={translatePage}
          >
            {isPageTranslated ? (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                <span>{getText('backToOriginal')}</span>
              </>
            ) : (
              <>
                <Globe className="mr-2 h-4 w-4 text-blue-500" />
                <span>{getText('translate')}</span>
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-xl" aria-describedby="translation-dialog-description">
          <DialogHeader>
            <DialogTitle id="translation-dialog-title">{getText('translatePage')}</DialogTitle>
            <DialogDescription id="translation-dialog-description">
              {getText('chooseLang')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm">{getText('translateTo')}:</span>
              <Select value={targetLanguage} onValueChange={(value) => {
                console.log(`Select onValueChange fired with value: ${value}`);
                setTargetLanguage(value);
                // Don't call handleLanguageChange here - just update the UI dropdown
                // handleLanguageChange will be called when the user clicks the Translate button
              }} disabled={isTranslating}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent 
                  className="max-h-[300px]"
                  position="popper"
                  viewportClassName="overflow-y-auto"
                >
                  {supportedLanguages
                    .map((language) => (
                      <SelectItem 
                        key={language.code} 
                        value={language.code}
                      >
                        {getLanguageDisplayName(language.code)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm">{getText('translationInfo')}</p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isTranslating}
            >
              {getText('cancel')}
            </Button>
            <Button 
              onClick={() => {
                // Just translate to the target language, don't save as preference
                handleTranslatePage();
              }}
              disabled={isTranslating}
            >
              {isTranslating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {getText('translating')}
                </>
              ) : (
                getText('translate')
              )}
            </Button>
            {/* Add a new UI element to explicitly set preferred language */}
            <div className="ml-4 text-xs flex items-center space-x-2 border-l pl-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleLanguageChange(targetLanguage)}
                disabled={isTranslating || targetLanguage === preferredLanguage}
                title="Set this as your preferred language for future sessions"
              >
                {getText('saveAsPreferred')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </GlobalTranslationContext.Provider>
  );
}
