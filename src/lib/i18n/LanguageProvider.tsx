"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Dictionary, Locale } from "./types";

const STORAGE_KEY = "saiza-locale";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  dictionaries,
}: {
  children: React.ReactNode;
  dictionaries: Record<Locale, Dictionary>;
}) {
  const [locale, setLocaleState] = useState<Locale>("vi");

  useEffect(() => {
    // Reading localStorage must happen post-mount (SSR has no window), so the
    // server-rendered default locale intentionally updates once hydration completes.
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "vi" || stored === "en") setLocaleState(stored);
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({ locale, setLocale, t: dictionaries[locale] }),
    [locale, dictionaries],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
