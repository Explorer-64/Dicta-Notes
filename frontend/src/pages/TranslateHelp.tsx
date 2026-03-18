import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from 'components/Header';
import { ChevronLeft, Globe, BookOpen, ExternalLink, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLanguageName } from "utils/languageUtils";

export default function TranslateHelp() {
  const navigate = useNavigate();
  
  // Get user's browser language for personalized examples
  const userLanguage = navigator.language.split('-')[0] || 'en';
  const userLanguageName = getLanguageName(userLanguage);

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Translation Help | Dicta-Notes</title>
        <meta name="description" content="Learn how to translate Dicta-Notes into your preferred language using your browser's built-in translation features." />
      </Helmet>
      
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Button 
            variant="ghost" 
            className="mb-4 pl-0"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            <Globe className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Translation Features</h1>
          </div>
          
          <p className="text-lg text-muted-foreground">
            Dicta-Notes offers two types of translation features to make content accessible in your language.
          </p>

          <Tabs defaultValue="transcript" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="transcript">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Transcript Translation</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="ui">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>App UI Translation</span>
                </div>
              </TabsTrigger>
            </TabsList>
            
            {/* New content translation tab */}
            <TabsContent value="transcript" className="space-y-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Automatic Language Detection</CardTitle>
                  <CardDescription>
                    Dicta-Notes automatically identifies different languages in your transcripts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    During transcription and in saved sessions, we detect when speakers use languages 
                    other than your preferred language. These segments are marked with a language tag 
                    and can be translated with a single click.
                  </p>
                  <div className="bg-muted p-4 rounded-md">
                    <div className="font-medium">For example:</div>
                    <div className="flex items-start gap-2 mt-2">
                      <span className="font-semibold text-blue-600 shrink-0">Speaker 1:</span>
                      <div>
                        <p>Buenos días a todos. ¿Cómo están hoy?</p>
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                          Spanish
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Smart Language Preferences</CardTitle>
                  <CardDescription>
                    Translations adapt to your browser's language settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Dicta-Notes detects your preferred language based on your browser settings. 
                    This means translation options are personalized for you:
                  </p>
                  
                  <div className="bg-muted p-4 rounded-md space-y-4">
                    <div>
                      <div className="font-medium mb-1">Your current language:</div>
                      <p className="text-primary font-semibold">{userLanguageName}</p>
                    </div>
                    
                    <div>
                      <div className="font-medium mb-1">What this means:</div>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>
                          When you see content in other languages, you'll see a 
                          <span className="px-2 py-0.5 mx-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            Translate to {userLanguageName}
                          </span> 
                          button
                        </li>
                        <li>
                          If you change your browser language settings, the translation target will update automatically
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Using Translations</CardTitle>
                  <CardDescription>
                    How to translate content in your transcripts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ol className="list-decimal pl-5 space-y-3">
                    <li>
                      <strong>Identify foreign language segments</strong> - Look for the language tag next to text
                    </li>
                    <li>
                      <strong>Click the translate button</strong> - Each foreign language segment has its own translate button
                    </li>
                    <li>
                      <strong>View the translation</strong> - The translated text appears below the original
                    </li>
                    <li>
                      <strong>Toggle as needed</strong> - You can hide the translation to see just the original text
                    </li>
                  </ol>
                  
                  <div className="bg-muted p-4 rounded-md mt-2">
                    <div className="text-sm text-muted-foreground">
                      <strong>Note:</strong> Translation quality depends on the clarity of the original audio. 
                      For critical content, we recommend having a human translator review the translations.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Original UI translation tab */}
            <TabsContent value="ui" className="space-y-8 pt-4">
            <div className="border rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold">Chrome & Edge</h2>
              <ol className="list-decimal pl-6 space-y-3">
                <li>Look for the translation icon <span className="inline-block w-6 text-center">🌐</span> in your browser's address bar</li>
                <li>Click on it and select "Translate this page"</li>
                <li>Choose your preferred language from the dropdown</li>
                <li>The page will refresh with translated content</li>
              </ol>
              <div className="mt-4">
                <a 
                  href="https://support.google.com/chrome/answer/173424" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center"
                >
                  Chrome Translation Help
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="border rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold">Safari</h2>
              <ol className="list-decimal pl-6 space-y-3">
                <li>Click on the "aA" icon in the address bar</li>
                <li>Select "Translate to [Your Language]"</li>
                <li>If your language isn't listed, choose "Translation Settings"</li>
                <li>The page will refresh with translated content</li>
              </ol>
              <div className="mt-4">
                <a 
                  href="https://support.apple.com/guide/safari/translate-a-webpage-ibrw646b2ca2/mac" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center"
                >
                  Safari Translation Help
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="border rounded-lg p-6 space-y-4">
              <h2 className="text-xl font-semibold">Firefox</h2>
              <ol className="list-decimal pl-6 space-y-3">
                <li>Right-click anywhere on the page</li>
                <li>Select "Translate Page"</li>
                <li>Choose your preferred language</li>
                <li>The page will refresh with translated content</li>
              </ol>
              <div className="mt-4">
                <a 
                  href="https://support.mozilla.org/en-US/kb/firefox-page-translation" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center"
                >
                  Firefox Translation Help
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Multilingual Transcription</h2>
              <p className="mb-4">
                Dicta-Notes can transcribe audio in multiple languages. When recording, the AI will automatically
                detect the language being spoken and transcribe it with proper accents and characters.
              </p>
              <p>
                While the app interface can be translated using your browser, the transcription itself will
                be in the language that was actually spoken during recording.
              </p>
              <div className="mt-4">
                <Button 
                  variant="outline"
                  onClick={() => navigate('/instructions', { state: { tab: 'faqs' } })}
                  className="gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  Learn More in FAQ
                </Button>
              </div>
            </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center space-y-2 text-sm">
            <div className="text-center">
              <span className="font-semibold">Dicta-Notes</span> © {new Date().getFullYear()}
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
              <span onClick={() => navigate('/privacy')} className="text-muted-foreground hover:text-foreground cursor-pointer">Privacy</span>
              <span onClick={() => navigate('/terms')} className="text-muted-foreground hover:text-foreground cursor-pointer">Terms</span>
              <span onClick={() => navigate('/instructions')} className="text-muted-foreground hover:text-foreground cursor-pointer">Instructions</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
