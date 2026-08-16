"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import { newsItems } from "@/lib/data/news";

export function NewsPreview() {
  const { t } = useLanguage();

  return (
    <section className="border-t border-line bg-card">
      <Container className="py-30">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-8">
          <div className="flex max-w-[560px] flex-col gap-3.5">
            <span className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
              {t.home.news.eyebrow}
            </span>
            <h2 className="text-[clamp(34px,4vw,56px)] leading-[1.06] font-medium tracking-[-0.028em]">
              {t.home.news.title}
            </h2>
          </div>
          <Link href="/tin-tuc" className="border-b border-line pb-1 text-[14.5px] font-semibold text-accent">
            {t.home.news.viewAll}
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5.5">
          {newsItems.map((item) => {
            const copy = t.news[item.id];
            return (
              <a
                key={item.id}
                href={item.href}
                className="flex flex-col gap-3.5 text-inherit transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-wash">
                  <Image src={item.image} alt={copy.title} width={400} height={300} className="h-full w-full object-cover" />
                </div>
                <span className="text-[11px] font-semibold tracking-[0.14em] text-accent-2 uppercase">
                  {t.home.news.eyebrow}
                </span>
                <h3 className="text-[16.5px] leading-[1.45] font-semibold">{copy.title}</h3>
                <p className="text-sm leading-[1.65] text-ink-2">{copy.excerptShort}</p>
              </a>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
