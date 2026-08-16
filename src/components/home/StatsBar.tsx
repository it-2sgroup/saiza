"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";

const TARGETS = [6, 99.99, 3, 100] as const;
const COUNT_DURATION_MS = 1400;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

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

export function StatsBar() {
  const { t } = useLanguage();
  const { ref, progress } = useCountUp();

  const stats = [
    { value: `${Math.round(TARGETS[0] * progress)}`, label: t.home.stats.productLines },
    { value: `${(TARGETS[1] * progress).toFixed(2).replace(".", ",")}%`, label: t.home.stats.antibacterial },
    { value: `${Math.round(TARGETS[2] * progress)}`, label: t.home.stats.marketplaces },
    { value: `${Math.round(TARGETS[3] * progress)}%`, label: t.home.stats.safeIngredients },
  ];

  return (
    <section className="bg-paper" ref={ref}>
      <Container className="flex flex-wrap justify-center gap-x-16 py-16">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex flex-col gap-2 px-8 ${i > 0 ? "border-l border-line" : "pr-8 pl-0"} ${
              i === stats.length - 1 ? "pr-0" : ""
            }`}
          >
            <span className="font-medium text-[48px] tracking-[-0.03em] text-accent-2 tabular-nums">
              {stat.value}
            </span>
            <span className="max-w-[16ch] text-[13px] leading-[1.5] text-ink-2">{stat.label}</span>
          </div>
        ))}
      </Container>
    </section>
  );
}
