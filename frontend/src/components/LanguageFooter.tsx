import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const languages = [
  { name: "English", path: "/" },
  { name: "Español", path: "/spanish" },
  { name: "Français", path: "/french" },
  { name: "Deutsch", path: "/german" },
  { name: "Português", path: "/portuguese" },
  { name: "中文", path: "/chinese" },
  { name: "日本語", path: "/japanese" },
  { name: "العربية", path: "/arabic" },
  { name: "हिन्दी", path: "/hindi" },
  { name: "Русский", path: "/russian" },
  { name: "한국어", path: "/korean" },
  { name: "Afrikaans", path: "/afrikaans" },
  { name: "Malay", path: "/malay" },
  { name: "Swahili", path: "/swahili" },
  { name: "Hausa", path: "/hausa" },
  { name: "Yoruba", path: "/yoruba" },
  { name: "Zulu", path: "/zulu" },
  { name: "Tiếng Việt", path: "/vietnamese" },
  { name: "বাংলা", path: "/bengali" },
  { name: "Türkçe", path: "/turkish" },
  { name: "ไทย", path: "/thai" },
  { name: "Tagalog", path: "/tagalog" },
  { name: "Bahasa Indonesia", path: "/indonesian" },
  { name: "తెలుగు", path: "/telugu" },
  { name: "தமிழ்", path: "/tamil" },
  { name: "ਪੰਜਾਬੀ", path: "/punjabi" },
  { name: "Polski", path: "/polish" },
];

export const LanguageFooter: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <footer className="mt-12 pt-8 border-t">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-muted-foreground mb-3">
          {t("languageSelector.title", "View Dicta-Notes in other languages:")}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
          {languages.map((lang) => (
            <Button
              key={lang.path}
              variant="ghost"
              size="sm"
              onClick={() => navigate(lang.path)}
            >
              {lang.name}
            </Button>
          ))}
        </div>
      </div>
    </footer>
  );
};
