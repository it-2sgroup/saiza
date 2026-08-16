"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { realStats, type RealStatId } from "@/lib/data/realStats";
import type { Locale } from "@/lib/i18n/types";

const COUNT_DURATION_MS = 1600;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const ICON_PATHS: Record<RealStatId, React.ReactNode> = {
  orders: (
    <>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </>
  ),
  units: (
    <>
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </>
  ),
  views: (
    <>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  lives: (
    <>
      <circle cx="12" cy="12" r="1.5" />
      <path d="M8.5 8.5a5 5 0 0 0 0 7" />
      <path d="M15.5 8.5a5 5 0 0 0 0 7" />
      <path d="M5.3 5.3a9 9 0 0 0 0 13.4" />
      <path d="M18.7 5.3a9 9 0 0 1 0 13.4" />
    </>
  ),
  creators: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
};

function useCountUp() {
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const runCountUp = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / COUNT_DURATION_MS);
        setProgress(easeOutCubic(t));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) runCountUp();
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, progress };
}

function formatNumber(value: number, decimals: number, grouped: boolean, locale: Locale) {
  const fixed = value.toFixed(decimals);
  if (!grouped) return locale === "vi" ? fixed.replace(".", ",") : fixed;
  const [intPart, decPart] = fixed.split(".");
  const sep = locale === "vi" ? "." : ",";
  const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
  return decPart ? `${groupedInt}${locale === "vi" ? "," : "."}${decPart}` : groupedInt;
}

export function StatsBar() {
  const { t, locale } = useLanguage();
  const { ref, progress } = useCountUp();

  return (
    <section className="relative overflow-hidden bg-ink text-white" ref={ref}>
      <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-accent-2 via-accent to-transparent" />
      <Container className="py-24">
        <SectionHeading
          eyebrow={t.home.stats.eyebrow}
          title={t.home.stats.title}
          subtitle={t.home.stats.subtitle}
          tone="light"
          align="center"
          className="mx-auto mb-16 max-w-[620px]"
        />
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          {realStats.map((stat) => {
            const displayValue = formatNumber(stat.target * progress, stat.decimals, stat.grouped, locale);
            const suffix = stat.id === "views" ? ` ${t.home.stats.million}` : "+";
            return (
              <div key={stat.id} className="flex flex-col items-center gap-4 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-accent-2">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {ICON_PATHS[stat.id]}
                  </svg>
                </span>
                <span className="font-medium text-[36px] tracking-[-0.02em] text-white tabular-nums">
                  {displayValue}
                  {suffix}
                </span>
                <span className="max-w-[18ch] text-[13.5px] leading-[1.5] text-white/62">
                  {t.home.stats[stat.id]}
                </span>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
