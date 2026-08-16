"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LinkButton } from "@/components/ui/Button";

const HERO_IMAGES = [
  "/images/banner-kitchen-bathroom.png",
  "/images/banner-product-closeup.png",
  "/images/banner-warehouse.png",
];

const ROTATE_INTERVAL_MS = 4800;

export function Hero() {
  const { t, locale } = useLanguage();
  const [activeIdx, setActiveIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    timerRef.current = setInterval(() => {
      setActiveIdx((idx) => (idx + 1) % HERO_IMAGES.length);
    }, ROTATE_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const beforeWords = t.home.hero.titleBefore.split(" ");
  const afterWords = t.home.hero.titleAfter.split(" ");
  const allWords = [...beforeWords, { accent: t.home.hero.titleAccent }, ...afterWords] as (
    | string
    | { accent: string }
  )[];

  return (
    <section className="relative flex h-screen min-h-[640px] items-center overflow-hidden bg-ink">
      {HERO_IMAGES.map((src, idx) => (
        <Image
          key={src}
          src={src}
          alt="SAIZA"
          fill
          priority={idx === 0}
          className="animate-kenburns object-cover transition-opacity duration-[1.5s] ease-in-out"
          style={{ opacity: idx === activeIdx ? 1 : 0 }}
        />
      ))}
      <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(9,26,27,0.90)_0%,rgba(9,26,27,0.66)_42%,rgba(9,26,27,0.18)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-[linear-gradient(to_top,rgba(9,26,27,0.75),transparent)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col gap-6.5 px-8 text-white">
        <span className="animate-soft-in inline-flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-white/82 uppercase">
          <span className="animate-line-grow h-px bg-white/70 [animation-delay:0.25s]" />
          {t.home.hero.eyebrow}
        </span>

        <h1 className="max-w-[15ch] text-[clamp(44px,6vw,88px)] leading-[1.0] font-medium tracking-[-0.03em] text-pretty">
          {allWords.map((word, i) => {
            const isAccent = typeof word !== "string";
            const delay = `${0.15 + i * 0.12}s`;
            return (
              <span key={i} className="animate-word-up inline-block" style={{ animationDelay: delay }}>
                {isAccent ? (
                  <span className="text-[#8FB0F0] italic">{word.accent}</span>
                ) : (
                  word
                )}
                {i < allWords.length - 1 ? " " : ""}
              </span>
            );
          })}
        </h1>

        <p className="animate-soft-in max-w-[540px] text-[17.5px] leading-[1.7] text-white/78 text-pretty [animation-delay:1.15s]">
          {t.home.hero.subtitle}
        </p>

        <div className="animate-soft-in flex flex-wrap items-center gap-3.5 [animation-delay:1.3s]">
          <LinkButton href="/san-pham" variant="light">
            {t.home.hero.ctaPrimary}
          </LinkButton>
          <LinkButton href="/doi-tac-dai-ly" variant="outline">
            {t.home.hero.ctaSecondary}
          </LinkButton>
          <span className="ml-1.5 text-[13px] text-white/62">{t.home.hero.marketplaceNote}</span>
        </div>

        <div className="animate-soft-in mt-1.5 flex gap-2.5 [animation-delay:1.45s]">
          {HERO_IMAGES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Slide ${idx + 1}`}
              aria-current={idx === activeIdx}
              onClick={() => setActiveIdx(idx)}
              className="flex items-center justify-center p-2.5"
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 ${
                  idx === activeIdx ? "w-5.5 bg-white" : "w-2 bg-white/55"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div
        className="animate-soft-in absolute top-32 right-8 z-10 hidden w-44 flex-col gap-1 rounded-3xl border border-white/25 bg-white/10 p-5 text-white shadow-[0_20px_50px_rgba(9,26,27,0.35)] backdrop-blur-xl [animation-delay:1.6s] lg:flex"
        aria-hidden="true"
      >
        <span className="text-[40px] leading-none font-semibold tracking-[-0.02em]">
          {locale === "vi" ? "99,99%" : "99.99%"}
        </span>
        <span className="text-[13px] leading-snug text-white/70">{t.home.stats.antibacterial}</span>
      </div>

      <div className="animate-soft-in absolute bottom-7 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/60 [animation-delay:1.8s] md:flex">
        <span className="text-[11px] tracking-[0.2em] uppercase">Cuộn xuống</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-bounce"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}
