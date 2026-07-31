import React, { createContext, useContext, useState, useEffect } from "react";
import { DEFAULT_TRANSLATIONS, LanguageCode, TranslationDictionary } from "./translations.js";

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  availableLanguages: string[];
  translations: Record<string, TranslationDictionary>;
  t: (key: string, params?: Record<string, string | number>) => string;
  updateTranslationKey: (lang: string, key: string, value: string) => void;
  addTranslationKey: (key: string, esVal: string, enVal: string) => void;
  addLanguage: (langCode: string) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const I18N_STORAGE_KEY = "truco_i18n_dict";
const LANG_STORAGE_KEY = "truco_selected_lang";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    return localStorage.getItem(LANG_STORAGE_KEY) || "es";
  });

  const [translations, setTranslations] = useState<Record<string, TranslationDictionary>>(() => {
    const saved = localStorage.getItem(I18N_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_TRANSLATIONS, ...parsed };
      } catch {}
    }
    return DEFAULT_TRANSLATIONS;
  });

  useEffect(() => {
    localStorage.setItem(LANG_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(I18N_STORAGE_KEY, JSON.stringify(translations));
  }, [translations]);

  function setLanguage(lang: LanguageCode) {
    setLanguageState(lang);
  }

  function t(key: string, params?: Record<string, string | number>): string {
    const langDict = translations[language] || translations["es"] || translations["en"] || {};
    let text = langDict[key] || translations["es"]?.[key] || translations["en"]?.[key] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(val));
      });
    }

    return text;
  }

  function updateTranslationKey(lang: string, key: string, value: string) {
    setTranslations((prev) => ({
      ...prev,
      [lang]: {
        ...(prev[lang] || {}),
        [key]: value,
      },
    }));
  }

  function addTranslationKey(key: string, esVal: string, enVal: string) {
    setTranslations((prev) => ({
      ...prev,
      es: { ...(prev.es || {}), [key]: esVal },
      en: { ...(prev.en || {}), [key]: enVal },
    }));
  }

  function addLanguage(langCode: string) {
    const code = langCode.toLowerCase().trim();
    if (!code || translations[code]) return;
    setTranslations((prev) => ({
      ...prev,
      [code]: { ...prev.en },
    }));
  }

  const availableLanguages = Object.keys(translations);

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        availableLanguages,
        translations,
        t,
        updateTranslationKey,
        addTranslationKey,
        addLanguage,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
