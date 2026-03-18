import React from 'react';
import { UIInternationalizationDebug } from '../components/UIInternationalizationDebug';
import { GlobalTranslation } from '../components/GlobalTranslation';
import { TranslationButton } from '../components/TranslationButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { NoIndexMeta } from 'components/NoIndexMeta';

export default function UIInternationalizationTest() {
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <NoIndexMeta />
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">UI Internationalization Test</h1>
        <p className="text-muted-foreground">
          Testing internationalized translation UI for non-English speakers (MYA-278)
        </p>
      </div>
      
      <Separator />
      
      {/* Debug Component */}
      <UIInternationalizationDebug />
      
      <Separator />
      
      {/* Test Translation Components */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Translation Component Tests</CardTitle>
          <CardDescription>
            Test the actual translation components with localized text
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Global Translation Button */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Global Translation Button</h3>
            <div className="flex gap-2">
              <GlobalTranslation buttonVariant="outline" buttonSize="default" />
              <GlobalTranslation buttonVariant="default" buttonSize="sm" />
            </div>
          </div>
          
          {/* Individual Translation Button */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Individual Translation Button</h3>
            <div className="space-y-2">
              <div className="p-4 border rounded bg-muted/20">
                <p className="mb-2 text-sm">Sample text in English to translate:</p>
                <p className="text-base">"Hello, this is a test message for translation."</p>
                <div className="mt-3">
                  <TranslationButton
                    originalText="Hello, this is a test message for translation."
                    sourceLanguage="en"
                    targetLanguage="es"
                    size="sm"
                    onTranslated={(translated) => {
                      console.log('Translated text:', translated);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Test Instructions</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>1. Change your browser language to test automatic detection</p>
              <p>2. Use the language switcher above to test different UI languages</p>
              <p>3. Try the translation buttons to see localized text</p>
              <p>4. Verify that unsupported languages fall back to English</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
