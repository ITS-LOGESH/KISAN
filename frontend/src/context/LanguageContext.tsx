import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  SupportedLanguage,
  TamilDialect,
  SUPPORTED_LANGUAGES,
  LanguageOption,
  translations,
  t as resolveT
} from '../utils/i18n';
import { api } from '../services/api';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  tamilDialect: TamilDialect;
  setTamilDialect: (dialect: TamilDialect) => void;
  t: (key: string, defaultText?: string) => string;
  supportedLanguages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_LANG_KEY = 'kisan_language';
const STORAGE_DIALECT_KEY = 'kisan_tamil_dialect';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved && ['en', 'ta', 'hi', 'te', 'kn', 'ml', 'mr', 'bn'].includes(saved)) {
      return saved as SupportedLanguage;
    }
    return 'en';
  });

  const [tamilDialect, setTamilDialectState] = useState<TamilDialect>(() => {
    const saved = localStorage.getItem(STORAGE_DIALECT_KEY);
    if (saved === 'standard' || saved === 'natural') {
      return saved as TamilDialect;
    }
    return 'natural';
  });

  // On mount, sync with backend user profile if available
  useEffect(() => {
    let isMounted = true;
    api.getUserProfile()
      .then((profile) => {
        if (!isMounted || !profile) return;
        if (profile.preferred_language && ['en', 'ta', 'hi', 'te', 'kn', 'ml', 'mr', 'bn'].includes(profile.preferred_language)) {
          // If localStorage is default 'en' and backend has a specific preference, adopt backend preference
          const localSaved = localStorage.getItem(STORAGE_LANG_KEY);
          if (!localSaved) {
            setLanguageState(profile.preferred_language as SupportedLanguage);
            localStorage.setItem(STORAGE_LANG_KEY, profile.preferred_language);
          }
        }
        if (profile.tamil_dialect && (profile.tamil_dialect === 'standard' || profile.tamil_dialect === 'natural')) {
          const localDialect = localStorage.getItem(STORAGE_DIALECT_KEY);
          if (!localDialect) {
            setTamilDialectState(profile.tamil_dialect as TamilDialect);
            localStorage.setItem(STORAGE_DIALECT_KEY, profile.tamil_dialect);
          }
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = useCallback((newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    localStorage.setItem(STORAGE_LANG_KEY, newLang);

    // Sync to backend user profile asynchronously
    api.updateUserProfile({
      preferred_language: newLang,
      tamil_dialect: newLang === 'ta' ? tamilDialect : undefined,
    }).catch((err) => {
      console.warn('Failed to sync language preference to profile:', err);
    });
  }, [tamilDialect]);

  const setTamilDialect = useCallback((newDialect: TamilDialect) => {
    setTamilDialectState(newDialect);
    localStorage.setItem(STORAGE_DIALECT_KEY, newDialect);

    // Sync to backend user profile asynchronously
    api.updateUserProfile({
      preferred_language: language,
      tamil_dialect: newDialect,
    }).catch((err) => {
      console.warn('Failed to sync tamil dialect preference to profile:', err);
    });
  }, [language]);

  const t = useCallback((key: string, defaultText?: string): string => {
    const val = resolveT(key, language, tamilDialect);
    if (val === key && defaultText) {
      return defaultText;
    }
    return val;
  }, [language, tamilDialect]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        tamilDialect,
        setTamilDialect,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
