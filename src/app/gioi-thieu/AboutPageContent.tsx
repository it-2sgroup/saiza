"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import { galleryImages } from "@/lib/data/gallery";

export function AboutPageContent() {
  const { t } = useLanguage();
  const facts = [t.aboutPage.vision, t.aboutPage.mission, t.aboutPage.values, t.aboutPage.capabilities];

  return (
    <>
      <Container className="grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] items-center gap-14 pt-18 pb-16">
        <div className="flex flex-col gap-4.5">
          <span className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            {t.aboutPage.eyebrow}
          </span>
          <h1 className="text-[clamp(34px,4vw,54px)] leading-[1.1] font-medium tracking-[-0.02em]">
            {t.aboutPage.title}
          </h1>
          {t.aboutPage.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-[16.5px] leading-[1.8] text-ink-2">
              {paragraph}
            </p>
          ))}
        </div>
        <div className="aspect-[4/3] overflow-hidden rounded-card bg-wash">
          <Image
            src="https://2sgroup.vn/wp-content/uploads/2025/04/102581-1024x682.jpg"
            alt="2S Group"
            width={640}
            height={480}
            className="h-full w-full object-cover"
          />
        </div>
      </Container>

      <section className="border-y border-line bg-card">
        <Container className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-8 py-18">
          {facts.map((fact) => (
            <div key={fact.title} className="flex flex-col gap-2.5">
              <h3 className="text-xl font-semibold">{fact.title}</h3>
              <p className="text-[14.5px] leading-[1.75] text-ink-2">{fact.body}</p>
            </div>
          ))}
        </Container>
      </section>

      <Container className="py-18">
        <h2 className="mb-8 text-[clamp(26px,3vw,38px)] font-medium tracking-[-0.015em]">
          {t.aboutPage.galleryTitle}
        </h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {galleryImages.map((src) => (
            <div key={src} className="aspect-[4/3] overflow-hidden rounded-2xl bg-wash">
              <Image src={src} alt="" width={400} height={300} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}
