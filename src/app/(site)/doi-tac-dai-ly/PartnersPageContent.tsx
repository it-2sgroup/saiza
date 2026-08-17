"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { WaveDivider } from "@/components/ui/WaveDivider";

export function PartnersPageContent() {
  const { t } = useLanguage();

  return (
    <>
      <Container className="max-w-[820px] pt-32 pb-14">
        <div className="flex flex-col gap-4.5">
          <span className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            {t.partnersPage.eyebrow}
          </span>
          <h1 className="text-[clamp(34px,4vw,54px)] leading-[1.1] font-medium tracking-[-0.02em]">
            {t.partnersPage.title}
          </h1>
          <p className="text-[16.5px] leading-[1.8] text-ink-2">{t.partnersPage.subtitle}</p>
        </div>
      </Container>

      <Container className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5.5 pb-18">
        {t.partnersPage.steps.map((step) => (
          <div key={step.number} className="flex flex-col gap-3 rounded-card border border-line bg-card p-7">
            <span className="text-[15px] text-accent">{step.number}</span>
            <h3 className="text-[17px] font-semibold">{step.title}</h3>
            <p className="text-[14.5px] leading-[1.7] text-ink-2">{step.desc}</p>
          </div>
        ))}
      </Container>

      <WaveDivider topClassName="bg-paper" fill="var(--color-ink)" />
      <section className="bg-ink text-white">
        <Container className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-center gap-12 py-18">
          <div className="flex flex-col gap-4">
            <h2 className="text-[clamp(28px,3.2vw,40px)] leading-[1.15] font-medium">{t.partnersPage.ctaTitle}</h2>
            <p className="text-[15.5px] leading-[1.75] text-white/66">{t.partnersPage.ctaSubtitle}</p>
            <LinkButton href="/lien-he" variant="light" className="mt-2 self-start">
              {t.partnersPage.ctaButton}
            </LinkButton>
          </div>
          <div className="aspect-[16/10] overflow-hidden rounded-card">
            <Image
              src="https://2sgroup.vn/wp-content/uploads/2025/04/11f57cbc-5a38-44e2-9040-47f02ba311b9-20240705-ADP-Bosch-17-1024x576.webp"
              alt=""
              width={640}
              height={400}
              className="h-full w-full object-cover"
            />
          </div>
        </Container>
      </section>
      <WaveDivider topClassName="bg-ink" fill="var(--color-wash)" />
    </>
  );
}
