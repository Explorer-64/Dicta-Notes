import React, { useEffect, useState } from 'react';
import { useLanguageStore } from '../utils/languageStore';
import brain from 'brain';
import { toast } from 'sonner';
import { getLanguageName } from '../utils/languageUtils';
import { checkTranslationCache, saveToTranslationCache } from '../utils/translationCache';
import { useLocation } from 'react-router-dom';
import { sha256 } from '../utils/hashUtils';
import { useCurrentUser } from 'app';

interface AutoLanguageInitializerProps {
  // Whether to show a toast notification when auto-translating
  showNotification?: boolean;
}

export function AutoLanguageInitializer({ showNotification = true }: AutoLanguageInitializerProps) {
  const { preferredLanguage, isInitialized } = useLanguageStore();
  const [isTranslating, setIsTranslating] = useState(false);
  const [hasTranslated, setHasTranslated] = useState(false);
  const location = useLocation();
  const { user } = useCurrentUser();
  
  // Check if the page needs translation based on language preference
  const needsTranslation = preferredLanguage !== 'en' && isInitialized && !hasTranslated;
  
  // Helper function to apply translation to nodes
  const applyTranslation = (translatedText: string, textNodes: Text[]) => {
    // Split translated text into chunks and apply to nodes
    const translatedChunks = translatedText.split('\n\n');
    const maxNodes = Math.min(textNodes.length, translatedChunks.length);
    
    for (let i = 0; i < maxNodes; i++) {
      if (translatedChunks[i] && translatedChunks[i].trim()) {
        textNodes[i].textContent = translatedChunks[i];
      }
    }
    
    // Show success notification if enabled and this isn't an automatic page load translation
    if (showNotification && location.pathname !== '/') {
      // Only show for explicit user navigation, not initial load
      toast.success(`Page translated to ${getLanguageName(preferredLanguage)}`);
    }
    
    // Update document language attribute
    document.documentElement.setAttribute('lang', preferredLanguage);
    
    // Mark as translated
    setHasTranslated(true);
  };
  
  // Auto-translate the page when needed
  useEffect(() => {
    // Skip if already translated, still initializing, or no translation needed
    if (!needsTranslation || isTranslating) return;
    
    const translatePage = async () => {
      try {
        // Prevent multiple translations
        setIsTranslating(true);
        
        // Only translate if page language doesn't match preference
        const currentLang = document.documentElement.getAttribute('lang') || 'en';
        if (currentLang !== preferredLanguage) {
          // Get all text nodes from the page
          const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
              acceptNode: function(node) {
                // Skip script, style tags and empty nodes
                if (node.parentNode?.nodeName === 'SCRIPT' || 
                    node.parentNode?.nodeName === 'STYLE' ||
                    node.parentNode?.nodeName === 'NOSCRIPT' ||
                    node.textContent?.trim() === '') {
                  return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
              }
            }
          );
          
          // Collect all text nodes
          const textNodes: Text[] = [];
          let node;
          while (node = walker.nextNode()) {
            textNodes.push(node as Text);
          }
          
          // Extract the text content from all nodes
          const textContent = textNodes.map(node => node.textContent).join('\n\n');
          
          if (!textContent.trim()) {
            console.log('No visible text content found for auto-translation');
            return;
          }
          
          // First check the cache
          const pagePath = location.pathname;
          let translatedText: string | null = null;
          
          // Try localStorage cache first for non-authenticated users
          if (!user) {
            try {
              const localCacheStr = localStorage.getItem('translation-cache');
              if (localCacheStr) {
                const localCache = JSON.parse(localCacheStr);
                // Generate cache key
                const contentHash = await sha256(textContent);
                const cacheKey = `${pagePath}-${preferredLanguage}-${contentHash}`;
                
                if (localCache[cacheKey] && 
                    Date.now() - localCache[cacheKey].timestamp <= 24 * 60 * 60 * 1000) {
                  translatedText = localCache[cacheKey].translatedContent;
                  console.log('Using localStorage translation cache for auto-translation');
                }
              }
            } catch (parseError) {
              console.error('Error parsing localStorage cache:', parseError);
              // Continue with Firestore check
            }
          }
          
          // If no localStorage hit, check Firestore cache
          if (!translatedText) {
            try {
              const cachedTranslation = await checkTranslationCache(pagePath, preferredLanguage, textContent);
              if (cachedTranslation) {
                translatedText = cachedTranslation;
                console.log('Using Firestore cached translation for auto-translation');
              }
            } catch (cacheError) {
              console.error('Error checking Firestore cache:', cacheError);
              // Continue with API call
            }
          }
          
          // If no cache hit, call the translation API
          if (!translatedText) {
            try {
              console.log('Cache miss, calling translation API for auto-translation');
              const response = await brain.translate_text({
                text: textContent,
                target_language: preferredLanguage
              });

              if (!response.ok) {
                throw new Error(`Auto-translation failed: ${response.statusText}`);
              }

              const result = await response.json();
              translatedText = result.translated_text;
              
              // Save to cache
              await saveToTranslationCache(pagePath, preferredLanguage, textContent, translatedText);
            } catch (apiError) {
              console.error('Translation API error:', apiError);
              throw apiError; // Re-throw to be caught by outer try/catch
            }
          }
          
          // Apply translation if we got one
          if (translatedText) {
            applyTranslation(translatedText, textNodes);
          }
        }
      } catch (error) {
        console.error('Auto-translation error:', error);
        if (showNotification) {
          toast.error('Failed to auto-translate page');
        }
      } finally {
        setIsTranslating(false);
      }
    };
    
    // Execute translation
    translatePage();
    
  }, [needsTranslation, preferredLanguage, isInitialized, hasTranslated, isTranslating, showNotification, user, location.pathname]);
  
  // Track page changes to reset translation state only if language changed
  useEffect(() => {
    // Only reset if the preferred language differs from what's currently showing
    const currentLang = document.documentElement.getAttribute('lang') || 'en';
    if (currentLang !== preferredLanguage && preferredLanguage !== 'en') {
      setHasTranslated(false);
      console.log('Language mismatch detected on navigation, will retranslate');
    } else if (currentLang === preferredLanguage) {
      // Already translated to preferred language, mark as translated
      setHasTranslated(true);
    }
  }, [location.pathname, preferredLanguage]);
  
  // This is a headless component
  return null;
}
