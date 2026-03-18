/**
 * UI Internationalization utility for non-English speakers
 * Provides localized text for translation UI elements based on browser language
 */

// Browser language detection
export const getBrowserLanguage = (): string => {
  if (typeof navigator === 'undefined') return 'en';
  
  // Get user's preferred languages from browser
  const languages = navigator.languages || [navigator.language];
  
  // Extract base language code (remove region)
  for (const lang of languages) {
    const baseCode = lang.split('-')[0].toLowerCase();
    if (uiTranslations[baseCode]) {
      return baseCode;
    }
  }
  
  return 'en'; // fallback to English
};

// UI text translations for major languages
export const uiTranslations: Record<string, {
  translate: string;
  translatePage: string;
  cancel: string;
  translating: string;
  translated: string;
  chooseLang: string;
  backToOriginal: string;
  translateTo: string;
  translationInfo: string;
  saveAsPreferred: string;
}> = {
  en: {
    translate: 'Translate',
    translatePage: 'Translate Page',
    cancel: 'Cancel',
    translating: 'Translating...',
    translated: 'Translated',
    chooseLang: 'Choose a language to translate this page to using our AI-powered translation.',
    backToOriginal: 'Back to Original',
    translateTo: 'Translate to',
    translationInfo: 'This will translate the visible text content of the page using our AI translation service.',
    saveAsPreferred: 'Save as Preferred',
  },
  es: {
    translate: 'Traducir',
    translatePage: 'Traducir Página',
    cancel: 'Cancelar',
    translating: 'Traduciendo...',
    translated: 'Traducido',
    chooseLang: 'Elige un idioma para traducir esta página usando nuestra traducción impulsada por IA.',
    backToOriginal: 'Volver al Original',
    translateTo: 'Traducir a',
    translationInfo: 'Esto traducirá el contenido de texto visible de la página utilizando nuestro servicio de traducción de IA.',
    saveAsPreferred: 'Guardar como Preferido',
  },
  fr: {
    translate: 'Traduire',
    translatePage: 'Traduire la Page',
    cancel: 'Annuler',
    translating: 'Traduction...',
    translated: 'Traduit',
    chooseLang: 'Choisissez une langue pour traduire cette page en utilisant notre traduction alimentée par IA.',
    backToOriginal: 'Retour à l\'Original',
    translateTo: 'Traduire en',
    translationInfo: 'Ceci traduira le contenu textuel visible de la page à l\'aide de notre service de traduction par IA.',
    saveAsPreferred: 'Enregistrer comme Préféré',
  },
  de: {
    translate: 'Übersetzen',
    translatePage: 'Seite Übersetzen',
    cancel: 'Abbrechen',
    translating: 'Übersetzen...',
    translated: 'Übersetzt',
    chooseLang: 'Wählen Sie eine Sprache, um diese Seite mit unserer KI-gestützten Übersetzung zu übersetzen.',
    backToOriginal: 'Zurück zum Original',
    translateTo: 'Übersetzen nach',
    translationInfo: 'Dies übersetzt den sichtbaren Textinhalt der Seite mit unserem KI-Übersetzungsdienst.',
    saveAsPreferred: 'Als Bevorzugt Speichern',
  },
  ja: {
    translate: '翻訳',
    translatePage: 'ページを翻訳',
    cancel: 'キャンセル',
    translating: '翻訳中...',
    translated: '翻訳済み',
    chooseLang: 'AI翻訳を使用してこのページを翻訳する言語を選択してください。',
    backToOriginal: '元に戻す',
    translateTo: '翻訳先',
    translationInfo: 'これにより、AI翻訳サービスを使用してページの表示テキストコンテンツが翻訳されます。',
    saveAsPreferred: '優先として保存',
  },
  zh: {
    translate: '翻译',
    translatePage: '翻译页面',
    cancel: '取消',
    translating: '翻译中...',
    translated: '已翻译',
    chooseLang: '选择一种语言使用我们的AI翻译来翻译此页面。',
    backToOriginal: '返回原文',
    translateTo: '翻译为',
    translationInfo: '这将使用我们的AI翻译服务翻译页面的可见文本内容。',
    saveAsPreferred: '保存为偏好',
  },
  pt: {
    translate: 'Traduzir',
    translatePage: 'Traduzir Página',
    cancel: 'Cancelar',
    translating: 'Traduzindo...',
    translated: 'Traduzido',
    chooseLang: 'Escolha um idioma para traduzir esta página usando nossa tradução alimentada por IA.',
    backToOriginal: 'Voltar ao Original',
    translateTo: 'Traduzir para',
    translationInfo: 'Isso traduzirá o conteúdo de texto visível da página usando nosso serviço de tradução de IA.',
    saveAsPreferred: 'Salvar como Preferido',
  },
  ru: {
    translate: 'Перевести',
    translatePage: 'Перевести Страницу',
    cancel: 'Отмена',
    translating: 'Перевод...',
    translated: 'Переведено',
    chooseLang: 'Выберите язык для перевода этой страницы с помощью нашего AI-переводчика.',
    backToOriginal: 'Вернуться к оригиналу',
    translateTo: 'Перевести на',
    translationInfo: 'Это переведет видимое текстовое содержимое страницы с помощью нашего сервиса AI-перевода.',
    saveAsPreferred: 'Сохранить как Предпочтительное',
  },
  ar: {
    translate: 'ترجم',
    translatePage: 'ترجمة الصفحة',
    cancel: 'إلغاء',
    translating: 'جاري الترجمة...',
    translated: 'مترجم',
    chooseLang: 'اختر لغة لترجمة هذه الصفحة باستخدام الترجمة المدعومة بالذكاء الاصطناعي.',
    backToOriginal: 'العودة للأصل'
  },
  ko: {
    translate: '번역',
    translatePage: '페이지 번역',
    cancel: '취소',
    translating: '번역 중...',
    translated: '번역됨',
    chooseLang: 'AI 기반 번역을 사용하여 이 페이지를 번역할 언어를 선택하세요.',
    backToOriginal: '원본으로 돌아가기'
  },
  it: {
    translate: 'Traduci',
    translatePage: 'Traduci Pagina',
    cancel: 'Annulla',
    translating: 'Traduzione...',
    translated: 'Tradotto',
    chooseLang: 'Scegli una lingua per tradurre questa pagina usando la nostra traduzione alimentata da IA.',
    backToOriginal: 'Torna all\'Originale'
  },
  hi: {
    translate: 'अनुवाद करें',
    translatePage: 'पृष्ठ अनुवाद करें',
    cancel: 'रद्द करें',
    translating: 'अनुवाद हो रहा है...',
    translated: 'अनुवादित',
    chooseLang: 'हमारे AI-संचालित अनुवाद का उपयोग करके इस पृष्ठ का अनुवाद करने के लिए एक भाषा चुनें।',
    backToOriginal: 'मूल पर वापस जाएं'
  }
};

// Native language names for dropdown display
export const nativeLanguageNames: Record<string, string> = {
  'en': 'English',
  'es': 'Español',
  'fr': 'Français',
  'de': 'Deutsch',
  'it': 'Italiano',
  'pt': 'Português',
  'nl': 'Nederlands',
  'ja': '日本語',
  'ko': '한국어',
  'zh': '中文',
  'zh-cn': '简体中文',
  'zh-tw': '繁體中文',
  'ru': 'Русский',
  'ar': 'العربية',
  'hi': 'हिन्दी',
  'bn': 'বাংলা',
  'pa': 'ਪੰਜਾਬੀ',
  'ta': 'தமிழ்',
  'te': 'తెలుగు',
  'mr': 'मराठी',
  'gu': 'ગુજરાતી',
  'kn': 'ಕನ್ನಡ',
  'ml': 'മലയാളം',
  'th': 'ไทย',
  'vi': 'Tiếng Việt',
  'tr': 'Türkçe',
  'pl': 'Polski',
  'uk': 'Українська',
  'cs': 'Čeština',
  'sk': 'Slovenčina',
  'hu': 'Magyar',
  'ro': 'Română',
  'sv': 'Svenska',
  'no': 'Norsk',
  'da': 'Dansk',
  'fi': 'Suomi',
  'el': 'Ελληνικά',
  'he': 'עברית',
  'id': 'Bahasa Indonesia',
  'ms': 'Bahasa Melayu',
  'fil': 'Filipino',
  'sw': 'Kiswahili',
  'af': 'Afrikaans',
  'am': 'አማርኛ',
  'hy': 'Հայերեն',
  'az': 'Azərbaycan',
  'eu': 'Euskera',
  'be': 'Беларуская',
  'bs': 'Bosanski',
  'bg': 'Български',
  'ca': 'Català',
  'hr': 'Hrvatski',
  'et': 'Eesti',
  'ka': 'ქართული',
  'is': 'Íslenska',
  'lv': 'Latviešu',
  'lt': 'Lietuvių',
  'mk': 'Македонски',
  'mt': 'Malti',
  'sl': 'Slovenščina',
  'sr': 'Српски',
  'cy': 'Cymraeg'
};

// Get localized UI text based on browser language
export const getUIText = (key: keyof typeof uiTranslations.en): string => {
  const browserLang = getBrowserLanguage();
  return uiTranslations[browserLang]?.[key] || uiTranslations.en[key];
};

// Get native language name for display in dropdown
export const getNativeLanguageName = (langCode: string): string => {
  const baseCode = langCode.split('-')[0].toLowerCase();
  return nativeLanguageNames[baseCode] || nativeLanguageNames[langCode] || langCode;
};
