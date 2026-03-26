'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import en from './locales/en.json';
import bn from './locales/bn.json';

type Locale = 'en' | 'bn';

type TranslationData = typeof en;

const translations: Record<Locale, TranslationData> = { en, bn };

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

/**
 * Get a nested value from an object using dot-notation key.
 * e.g. getNestedValue(obj, "auth.loginTitle")
 */
function getNestedValue(obj: Record<string, any>, key: string): string {
  const keys = key.split('.');
  let result: any = obj;

  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      return key; // fallback: return the key itself
    }
  }

  return typeof result === 'string' ? result : key;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
      document.documentElement.lang = newLocale;
    }
  }, []);

  const t = useCallback(
    (key: string): string => {
      return getNestedValue(translations[locale] as Record<string, any>, key);
    },
    [locale]
  );

  // Restore locale from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale | null;
    if (saved && (saved === 'en' || saved === 'bn')) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}
