import React, { createContext, useContext, useMemo, useState, ReactNode, useEffect } from 'react';
import en from '@/locales/en.json';
import am from '@/locales/am.json';

export type SupportedLocale = 'en' | 'am';

interface I18nContextValue {
  lang: SupportedLocale;
  setLang: (lang: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => any;
}

const dictionaries: Record<SupportedLocale, Record<string, any>> = {
  en: en as Record<string, any>,
  am: am as Record<string, any>,
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<SupportedLocale>('en');

  useEffect(() => {
    const saved = (localStorage.getItem('lang') as SupportedLocale) || 'en';
    setLangState(saved);
  }, []);

  const setLang = (l: SupportedLocale) => {
    setLangState(l);
    localStorage.setItem('lang', l);
    document.documentElement.lang = l;
  };

  const t = useMemo(() => {
    const translate = (key: string, params?: Record<string, string | number>): any => {
      const getFrom = (obj: any, path: string): any => {
        return path.split('.').reduce((acc: any, part: string) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
      };
      const dict = dictionaries[lang] || dictionaries.en;
      let value = getFrom(dict, key);
      if (value === undefined) {
        value = getFrom(dictionaries.en, key);
      }
      if (typeof value === 'string') {
        if (params) {
          return Object.keys(params).reduce((acc, k) => acc.replace(new RegExp(`{${k}}`, 'g'), String(params[k])), value);
        }
        return value;
      }
      // If an array is stored at the key (e.g., weekdays), return as-is
      if (Array.isArray(value)) return value;
      // For non-string, non-array objects, avoid returning [object Object]
      if (value !== undefined && typeof value === 'object') return key;
      return key;
    };
    return translate;
  }, [lang]);

  const value: I18nContextValue = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
