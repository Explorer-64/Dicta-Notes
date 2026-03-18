import React from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Languages } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Google Web Speech API supported languages
const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Spanish (Spain)' },
  { code: 'es-MX', name: 'Spanish (Mexico)' },
  { code: 'fr-FR', name: 'French (France)' },
  { code: 'de-DE', name: 'German' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)' },
  { code: 'nl-NL', name: 'Dutch' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'ar-SA', name: 'Arabic' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'tr-TR', name: 'Turkish' },
  { code: 'pl-PL', name: 'Polish' },
  { code: 'sv-SE', name: 'Swedish' },
  { code: 'da-DK', name: 'Danish' },
  { code: 'no-NO', name: 'Norwegian' },
  { code: 'fi-FI', name: 'Finnish' },
];

interface Props {
  selectedLanguages: string[];
  onLanguagesChange: (languages: string[]) => void;
  maxLanguages?: number;
}

export function LanguagePicker({ selectedLanguages, onLanguagesChange, maxLanguages = 4 }: Props) {
  const handleAddLanguage = (languageCode: string) => {
    if (selectedLanguages.includes(languageCode)) {
      return; // Already selected
    }
    if (selectedLanguages.length >= maxLanguages) {
      return; // Max reached
    }
    onLanguagesChange([...selectedLanguages, languageCode]);
  };

  const handleRemoveLanguage = (languageCode: string) => {
    onLanguagesChange(selectedLanguages.filter(code => code !== languageCode));
  };

  const availableLanguages = SUPPORTED_LANGUAGES.filter(
    lang => !selectedLanguages.includes(lang.code)
  );

  const getLanguageName = (code: string) => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code)?.name || code;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <Languages className="h-5 w-5" />
              Transcription Languages
            </Label>
            <span className="text-sm text-muted-foreground">
              {selectedLanguages.length}/{maxLanguages} selected
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            Select up to {maxLanguages} languages for real-time transcription. Google Web Speech API will transcribe audio in these languages.
          </p>

          {/* Language selector */}
          {selectedLanguages.length < maxLanguages && (
            <Select onValueChange={handleAddLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Add a language..." />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Selected languages */}
          {selectedLanguages.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedLanguages.map(code => (
                <Badge key={code} variant="secondary" className="flex items-center gap-1 px-3 py-1">
                  {getLanguageName(code)}
                  <button
                    onClick={() => handleRemoveLanguage(code)}
                    className="text-muted-foreground hover:text-foreground ml-1 rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground bg-amber-50 border border-amber-200 rounded p-3">
              ⚠️ No languages selected. Please add at least one language for transcription.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
