import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { useLanguageStore } from '../utils/languageStore';
import { useCurrentUser } from 'app';

export function AutoTranslatePrompt() {
  const [visible, setVisible] = useState(false);
  const { preferredLanguage, setPreferredLanguage } = useLanguageStore();
  const { user } = useCurrentUser();
  
  useEffect(() => {
    // Get browser language
    const browserLang = navigator.language.split('-')[0].toLowerCase();
    
    // Check if language is not English and not already set in preferences
    const isNonEnglish = browserLang !== 'en';
    const hasSetPreference = preferredLanguage === browserLang;
    
    // Only show for non-English browsers and if they haven't set a preference matching their browser
    if (isNonEnglish && !hasSetPreference && !sessionStorage.getItem('translationHintShown')) {
      // Set a small delay so page loads first
      const timer = setTimeout(() => {
        setVisible(true);
        sessionStorage.setItem('translationHintShown', 'true');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Get appropriate translation message based on browser language
  const getBrowserSpecificMessage = () => {
    const browserLang = navigator.language.split('-')[0].toLowerCase();
    
    // Messages for top languages
    const messages: Record<string, string> = {
      es: '¿Traducir esta página? Usar el botón de traducción del navegador →',
      fr: 'Traduire cette page ? Utilisez le bouton de traduction du navigateur →',
      zh: '翻译此页面？使用浏览器的翻译按钮 →',
      ja: 'このページを翻訳しますか？ブラウザの翻訳ボタンを使用する →',
      ru: 'Перевести эту страницу? Используйте кнопку перевода браузера →',
      pt: 'Traduzir esta página? Use o botão de tradução do navegador →',
      de: 'Diese Seite übersetzen? Verwenden Sie die Übersetzungsschaltfläche des Browsers →',
      ar: 'ترجمة هذه الصفحة؟ استخدم زر الترجمة في المتصفح →'
    };
    
    return messages[browserLang] || 'Translate this page? Use your browser\'s translation button →';
  };
  
  if (!visible) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4 text-sm text-blue-800 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex-1">
        <p className="mb-1 font-medium">{getBrowserSpecificMessage()}</p>
        
        <div className="flex mt-2 gap-3">
          <button 
            onClick={() => {
              // Apply translation using our system instead of browser
              setPreferredLanguage(navigator.language.split('-')[0].toLowerCase(), user);
              toast.success('Applied your language preference');
              setVisible(false);
            }}
            className="text-blue-600 hover:text-blue-800 font-medium text-xs"
          >
            Enable Translation
          </button>
          <button 
            onClick={() => setVisible(false)}
            className="text-blue-600 hover:text-blue-800 font-medium text-xs"
          >
            Dismiss
          </button>
        </div>
      </div>
      <button 
        onClick={() => setVisible(false)}
        className="text-blue-500 hover:text-blue-700 flex-shrink-0"
      >
        <X size={18} />
      </button>
    </div>
  );
}
