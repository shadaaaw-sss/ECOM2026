'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { translations, Locale, TranslationKey } from '@/lib/translations';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
  currency: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const stored = localStorage.getItem('makhmal_locale') as Locale;
    if (stored && ['en', 'fr', 'ar'].includes(stored)) {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('makhmal_locale', newLocale);
  };

  const t = (key: TranslationKey): string => {
    return translations[locale][key] ?? translations.en[key] ?? key;
  };

  const isRTL = locale === 'ar';
  const currency = translations[locale].currency;

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, isRTL, currency }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
