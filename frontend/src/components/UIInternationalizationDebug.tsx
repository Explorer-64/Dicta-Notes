import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocalizedText } from '../utils/localizedUIText';
import { getBrowserLanguage, getNativeLanguageName, uiTranslations } from '../utils/uiInternationalization';
import { useUILanguageStore } from '../utils/uiLanguageStore';

export function UIInternationalizationDebug() {
  const { getText, currentUILanguage } = useLocalizedText();
  const { setUILanguage } = useUILanguageStore();
  
  const browserLang = getBrowserLanguage();
  const availableLanguages = Object.keys(uiTranslations);
  
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>UI Internationalization Debug</CardTitle>
        <CardDescription>
          Testing browser language detection and UI text localization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Browser Detection Info */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Browser Language Detection</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Detected Browser Language:</span>
              <Badge variant="outline" className="ml-2">{browserLang}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Current UI Language:</span>
              <Badge variant="outline" className="ml-2">{currentUILanguage}</Badge>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Navigator languages:</span>
            <span className="ml-2 text-xs font-mono">
              {typeof navigator !== 'undefined' ? JSON.stringify(navigator.languages) : 'N/A'}
            </span>
          </div>
        </div>
        
        {/* Localized Text Examples */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Localized UI Text Examples</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Translate:</span>
              <span className="font-medium">{getText('translate')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cancel:</span>
              <span className="font-medium">{getText('cancel')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Translating:</span>
              <span className="font-medium">{getText('translating')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Translated:</span>
              <span className="font-medium">{getText('translated')}</span>
            </div>
          </div>
        </div>
        
        {/* Native Language Names */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Native Language Names</h3>
          <div className="flex flex-wrap gap-2">
            {['en', 'es', 'fr', 'de', 'ja', 'zh', 'pt', 'ru', 'ar', 'ko'].map(lang => (
              <Badge key={lang} variant="secondary" className="text-xs">
                {lang}: {getNativeLanguageName(lang)}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Language Switcher for Testing */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Test Different UI Languages</h3>
          <div className="flex flex-wrap gap-2">
            {availableLanguages.map(lang => (
              <button
                key={lang}
                onClick={() => setUILanguage(lang)}
                className={`px-3 py-1 text-xs rounded border ${
                  currentUILanguage === lang 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background border-border hover:bg-muted'
                }`}
              >
                {getNativeLanguageName(lang)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Translation Modal Text Preview */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Translation Modal Text Preview</h3>
          <div className="p-3 border rounded bg-muted/50 space-y-1 text-sm">
            <div><strong>{getText('translatePage')}</strong></div>
            <div className="text-muted-foreground">{getText('chooseLang')}</div>
            <div className="mt-2 space-x-2">
              <button className="px-2 py-1 bg-background border rounded text-xs">
                {getText('cancel')}
              </button>
              <button className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs">
                {getText('translate')}
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
