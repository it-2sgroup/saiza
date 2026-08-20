"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const TOP_THRESHOLD_PX = 80;

export function BackToTop() {
  const { t } = useLanguage();
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY <= TOP_THRESHOLD_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior = prefersReducedMotion ? "auto" : "smooth";
    window.scrollTo({ top: atTop ? document.documentElement.scrollHeight : 0, behavior });
  };

  const label = atTop ? t.common.scrollToBottom : t.common.backToTop;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className="fixed right-5.5 bottom-72 z-[60] flex h-13 w-13 items-center justify-center rounded-full bg-ink text-white shadow-[0_10px_26px_rgba(22,33,62,0.28)] transition-all duration-300 hover:scale-108 hover:bg-accent"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {atTop ? <path d="M12 5v14M5 12l7 7 7-7" /> : <path d="M12 19V5M5 12l7-7 7 7" />}
      </svg>
    </button>
  );
}
