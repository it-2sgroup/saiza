"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import { newsItems } from "@/lib/data/news";

export function NewsPageContent() {
  const { t } = useLanguage();

  return (
    <Container className="pt-18 pb-24">
      <div className="mb-12 flex max-w-[680px] flex-col gap-4">
        <span className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">{t.newsPage.eyebrow}</span>
        <h1 className="text-[clamp(34px,4vw,54px)] leading-[1.1] font-medium tracking-[-0.02em]">
          {t.newsPage.title}
        </h1>
      </div>
      <div className="flex flex-col">
        {newsItems.map((item, i) => {
          const copy = t.news[item.id];
          return (
            <a
              key={item.id}
              href={item.href}
              className={`grid grid-cols-[220px_1fr] items-center gap-7 border-t border-line py-7 text-inherit ${
                i === newsItems.length - 1 ? "border-b" : ""
              }`}
            >
              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-wash">
                <Image src={item.image} alt={copy.title} width={220} height={165} className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold tracking-[0.14em] text-accent-2 uppercase">
                  {t.newsPage.eyebrow}
                </span>
                <h3 className="text-[22px] leading-[1.3] font-semibold">{copy.title}</h3>
                <p className="text-[15px] leading-[1.7] text-ink-2">{copy.excerptLong}</p>
              </div>
            </a>
          );
        })}
      </div>
    </Container>
  );
}
