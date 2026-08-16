"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function TrustStrip() {
  const { t } = useLanguage();

  return (
    <section className="border-y border-line bg-card">
      <Container className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5 py-10">
        {t.home.trust.map((item) => (
          <div
            key={item}
            className="flex items-start gap-3.5 rounded-2xl p-4.5 transition-all duration-300 hover:-translate-y-[3px] hover:bg-wash"
          >
            <span className="flex h-8.5 w-8.5 flex-shrink-0 items-center justify-center rounded-full bg-wash text-accent-2">
              <CheckIcon />
            </span>
            <span className="pt-1.5 text-[14.5px] leading-[1.5] text-ink-2">{item}</span>
          </div>
        ))}
      </Container>
    </section>
  );
}
