import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import brain from 'brain';
import { toast } from 'sonner';
import { getLanguageName } from './LanguageDetectionIndicator';
import { useLocalizedText } from '../utils/localizedUIText';

interface Props {
  originalText: string;
  sourceLanguage: string;
  targetLanguage?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  className?: string;
  onTranslated?: (translatedText: string) => void;
}

export function TranslationButton({
  originalText,
  sourceLanguage,
  targetLanguage = 'en',
  size = 'sm',
  variant = 'outline',
  className = '',
  onTranslated
}: Props) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);
  const { getText } = useLocalizedText();
  
  // Skip rendering if the text is empty
  if (!originalText) {
    return null;
  }
  
  // Handle translation click
  const handleTranslate = async () => {
    if (isTranslating) return;
    
    try {
      setIsTranslating(true);
      
      // Call translation API
      const response = await brain.translate_text({
        text: originalText,
        source_language: sourceLanguage,
        target_language: targetLanguage
      });
      
      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Call the callback with the translated text
      if (onTranslated && result.translated_text) {
        onTranslated(result.translated_text);
        setIsTranslated(true);
        toast.success(`Translated from ${getLanguageName(sourceLanguage)} to ${getLanguageName(targetLanguage)}`);
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to translate text');
    } finally {
      setIsTranslating(false);
    }
  };
  
  const sizeClasses = {
    sm: 'text-xs py-1 px-2',
    md: 'text-sm py-1.5 px-3',
    lg: 'text-base py-2 px-4'
  }[size];
  
  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleTranslate}
      disabled={isTranslating || isTranslated}
      className={`${sizeClasses} ${className} flex items-center gap-1`}
    >
      <Languages size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
      {isTranslated ? getText('translated') : isTranslating ? getText('translating') : getText('translate')}
    </Button>
  );
}
