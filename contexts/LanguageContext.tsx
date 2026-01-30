
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeLanguage, setLanguage as setI18nLanguage, getCurrentLanguage, t, type Language } from '@/utils/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLanguage = async () => {
      console.log('[LanguageProvider] Initializing language');
      const lang = await initializeLanguage();
      setLanguageState(lang);
      setIsLoading(false);
    };

    loadLanguage();
  }, []);

  const changeLanguage = async (lang: Language) => {
    console.log('[LanguageProvider] Changing language to:', lang);
    await setI18nLanguage(lang);
    setLanguageState(lang);
  };

  const value: LanguageContextType = {
    language,
    setLanguage: changeLanguage,
    t,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
