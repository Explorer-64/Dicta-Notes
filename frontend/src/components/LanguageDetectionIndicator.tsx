import React from 'react';
import { Badge } from '@/components/ui/badge';

// Dictionary of language codes to language names
const languageNames: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'nl': 'Dutch',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ru': 'Russian',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'bn': 'Bengali',
  'pa': 'Punjabi',
  'ta': 'Tamil',
  'te': 'Telugu',
  'mr': 'Marathi',
  'gu': 'Gujarati',
  'kn': 'Kannada',
  'ml': 'Malayalam',
  'th': 'Thai',
  'vi': 'Vietnamese',
  'tr': 'Turkish',
  'pl': 'Polish',
  'uk': 'Ukrainian',
  'cs': 'Czech',
  'sk': 'Slovak',
  'hu': 'Hungarian',
  'ro': 'Romanian',
  'sv': 'Swedish',
  'no': 'Norwegian',
  'da': 'Danish',
  'fi': 'Finnish',
  'el': 'Greek',
  'he': 'Hebrew',
  'id': 'Indonesian',
  'ms': 'Malay',
  'fil': 'Filipino',
  'sw': 'Swahili',
  'af': 'Afrikaans',
  'am': 'Amharic',
  'hy': 'Armenian',
  'az': 'Azerbaijani',
  'eu': 'Basque',
  'be': 'Belarusian',
  'bs': 'Bosnian',
  'bg': 'Bulgarian',
  'ca': 'Catalan',
  'ceb': 'Cebuano',
  'ny': 'Chichewa',
  'co': 'Corsican',
  'hr': 'Croatian',
  'eo': 'Esperanto',
  'et': 'Estonian',
  'tl': 'Filipino',
  'fy': 'Frisian',
  'gl': 'Galician',
  'ka': 'Georgian',
  'gd': 'Scottish Gaelic',
  'ha': 'Hausa',
  'haw': 'Hawaiian',
  'hmn': 'Hmong',
  'is': 'Icelandic',
  'ig': 'Igbo',
  'ga': 'Irish',
  'jw': 'Javanese',
  'kk': 'Kazakh',
  'km': 'Khmer',
  'ku': 'Kurdish',
  'ky': 'Kyrgyz',
  'lo': 'Lao',
  'la': 'Latin',
  'lv': 'Latvian',
  'lt': 'Lithuanian',
  'lb': 'Luxembourgish',
  'mk': 'Macedonian',
  'mg': 'Malagasy',
  'mt': 'Maltese',
  'mi': 'Maori',
  'mn': 'Mongolian',
  'my': 'Myanmar (Burmese)',
  'ne': 'Nepali',
  'ps': 'Pashto',
  'fa': 'Persian',
  'sm': 'Samoan',
  'sr': 'Serbian',
  'st': 'Sesotho',
  'sn': 'Shona',
  'sd': 'Sindhi',
  'si': 'Sinhala',
  'sl': 'Slovenian',
  'so': 'Somali',
  'su': 'Sundanese',
  'tg': 'Tajik',
  'tt': 'Tatar',
  'ur': 'Urdu',
  'uz': 'Uzbek',
  'cy': 'Welsh',
  'xh': 'Xhosa',
  'yi': 'Yiddish',
  'yo': 'Yoruba',
  'zu': 'Zulu'
};

// Helper function to get language name from language code
export function getLanguageName(langCode: string): string {
  // If we have a locale code with region (e.g., 'en-US'), get the base language
  const baseCode = langCode.split('-')[0].toLowerCase();
  return languageNames[baseCode] || langCode;
}

interface Props {
  languageCode?: string;
  variant?: 'default' | 'secondary' | 'outline';
  colorScheme?: string; // For custom color schemes
  showWhenEnglish?: boolean; // Whether to show indicator when language is English
}

export function LanguageDetectionIndicator({ 
  languageCode = 'en', 
  variant = 'outline', 
  colorScheme = '',
  showWhenEnglish = false
}: Props) {
  // Don't show anything if language is English and showWhenEnglish is false
  if (languageCode === 'en' && !showWhenEnglish) {
    return null;
  }
  
  // Class names based on color scheme
  let customClasses = '';
  
  if (colorScheme === 'blue') {
    customClasses = 'bg-blue-50 border-blue-200 text-blue-700';
  } else if (colorScheme === 'purple') {
    customClasses = 'bg-purple-50 border-purple-200 text-purple-700';
  }
  
  return (
    <Badge 
      variant={variant} 
      className={`text-xs ${customClasses}`}
    >
      {getLanguageName(languageCode)}
    </Badge>
  );
}
