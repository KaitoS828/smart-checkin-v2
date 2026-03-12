'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Locale, translations, TranslationKey } from './translations';

interface I18nContextType {
  locale: Locale;
  t: (key: TranslationKey) => string;
  toggleLocale: () => void;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('locale') as Locale | null;
      if (saved === 'ja' || saved === 'en' || saved === 'zh' || saved === 'ko') return saved;
      // Auto-detect browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('ja')) return 'ja';
      if (browserLang.startsWith('zh')) return 'zh';
      if (browserLang.startsWith('ko')) return 'ko';
      return 'en';
    }
    return 'ja';
  });

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[key]?.[locale] || key;
    },
    [locale]
  );

  const toggleLocale = useCallback(() => {
    setLocale((prev) => {
      let next: Locale;
      if (prev === 'ja') next = 'en';
      else if (prev === 'en') next = 'zh';
      else if (prev === 'zh') next = 'ko';
      else next = 'ja';
      
      localStorage.setItem('locale', next);
      return next;
    });
  }, []);

  return (
    <I18nContext.Provider value={{ locale, t, toggleLocale, setLocale: (l) => {
      localStorage.setItem('locale', l);
      setLocale(l);
    } }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
