import React, { createContext, useContext, useState } from "react";
import { getStoredLanguage, setStoredLanguage, SupportedLanguage } from "./config";
import enTranslations from "@/data/translations-en.json";
import trTranslations from "@/data/translations-tr.json";

type TranslationsType = typeof enTranslations;

interface LanguageContextProps {
  language: SupportedLanguage;
  t: (key: string) => string;
  changeLanguage: (lang: SupportedLanguage) => void;
  currency: "$" | "₺";
  formatPrice: (priceUSD: number, priceTRY: number) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<SupportedLanguage>(getStoredLanguage());

  const translations: Record<SupportedLanguage, TranslationsType> = {
    en: enTranslations,
    tr: trTranslations
  };

  const currency = language === "en" ? "$" : "₺";

  const changeLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang);
    setStoredLanguage(lang);
  };

  const t = (path: string): string => {
    const keys = path.split(".");
    let current: any = translations[language];
    
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        return path; // Fallback to path if translation key does not exist
      }
    }
    return current as string;
  };

  const formatPrice = (priceUSD: number, priceTRY: number): string => {
    if (language === "en") {
      return `$${priceUSD.toLocaleString("en-US")}`;
    }
    return `₺${priceTRY.toLocaleString("tr-TR")}`;
  };

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage, currency, formatPrice }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
