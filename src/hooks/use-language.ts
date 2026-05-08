'use client';

import { useState, useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  Language,
  TranslationKey,
  getTranslation,
  toBengaliNumber,
  SPOT_TYPE_TRANSLATIONS,
  DAY_TRANSLATIONS,
  DAY_SHORT_TRANSLATIONS,
  REPORT_TYPE_TRANSLATIONS,
  LANGUAGE_STORAGE_KEY,
} from '@/lib/i18n';

// Custom store for language
let currentLanguage: Language = 'bn';
const listeners = new Set<() => void>();

function getLanguageSnapshot(): Language {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'bn' || stored === 'en') {
      currentLanguage = stored;
    }
  }
  return currentLanguage;
}

function getServerSnapshot(): Language {
  return 'bn';
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function setLanguageValue(lang: Language) {
  currentLanguage = lang;
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }
  listeners.forEach(listener => listener());
}

// Initialize from localStorage on client
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === 'bn' || stored === 'en') {
    currentLanguage = stored;
  }
}

interface UseLanguageReturn {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  // Helper functions
  toBengaliNum: (num: number | string) => string;
  getSpotTypeLabel: (type: string) => string;
  getDayLabel: (day: string, short?: boolean) => string;
  getReportTypeLabel: (type: string) => string;
  // Language info
  isBengali: boolean;
  isEnglish: boolean;
}

export function useLanguage(): UseLanguageReturn {
  // Use useSyncExternalStore for better SSR support
  const language = useSyncExternalStore(subscribe, getLanguageSnapshot, getServerSnapshot);

  // Set language and persist to localStorage
  const setLanguage = useCallback((lang: Language) => {
    setLanguageValue(lang);
  }, []);

  // Translation function
  const t = useCallback(
    (key: TranslationKey): string => {
      return getTranslation(language, key);
    },
    [language]
  );

  // Bengali number converter
  const toBengaliNum = useCallback(
    (num: number | string): string => {
      return toBengaliNumber(num, language);
    },
    [language]
  );

  // Get spot type label
  const getSpotTypeLabel = useCallback(
    (type: string): string => {
      return SPOT_TYPE_TRANSLATIONS[language][type] || type;
    },
    [language]
  );

  // Get day label
  const getDayLabel = useCallback(
    (day: string, short: boolean = false): string => {
      const translations = short ? DAY_SHORT_TRANSLATIONS : DAY_TRANSLATIONS;
      return translations[language][day] || day;
    },
    [language]
  );

  // Get report type label
  const getReportTypeLabel = useCallback(
    (type: string): string => {
      return REPORT_TYPE_TRANSLATIONS[language][type] || type;
    },
    [language]
  );

  // Language flags
  const isBengali = useMemo(() => language === 'bn', [language]);
  const isEnglish = useMemo(() => language === 'en', [language]);

  return {
    language,
    setLanguage,
    t,
    toBengaliNum,
    getSpotTypeLabel,
    getDayLabel,
    getReportTypeLabel,
    isBengali,
    isEnglish,
  };
}

// Utility hook for checking if we're on the client
export function useLanguageHydrated(): boolean {
  // Always return true on server, actual value on client
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  return isClient;
}

// Export types
export type { Language, TranslationKey };
