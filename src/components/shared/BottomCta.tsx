"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";

export function BottomCta() {
  const { t } = useLanguage();

  return (
    <section className="border-t border-line bg-wash">
      <Container className="flex flex-col items-center gap-6 py-16 text-center">
        <h2 className="max-w-[620px] text-[clamp(26px,3vw,40px)] leading-[1.15] font-medium">
          {t.home.bottomCta.title}
        </h2>
        <p className="max-w-[520px] text-base leading-[1.7] text-ink-2">{t.home.bottomCta.subtitle}</p>
        <LinkButton href="/lien-he">{t.home.bottomCta.button}</LinkButton>
      </Container>
    </section>
  );
}
