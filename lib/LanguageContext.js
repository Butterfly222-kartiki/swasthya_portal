'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, supportedLanguages } from '@/lib/i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('swasthya_lang') || 'en') : 'en';
    setLanguage(saved);
  }, []);

  const changeLanguage = useCallback((code) => {
    setLanguage(code);
    if (typeof window !== 'undefined') localStorage.setItem('swasthya_lang', code);
  }, []);

  const t = useCallback((key) =>
    translations[language]?.[key] ?? translations['en']?.[key] ?? key,
  [language]);

  const speak = useCallback((text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = supportedLanguages.find(l => l.code === language)?.speechCode || 'en-IN';
    u.rate = 0.88;
    window.speechSynthesis.speak(u);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, speak, supportedLanguages }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
