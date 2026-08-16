"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { MarqueeToggle } from "@/components/ui/MarqueeToggle";
import { products } from "@/lib/data/products";

export function ProductCarousel() {
  const { t } = useLanguage();
  const [paused, setPaused] = useState(false);
  const loopedProducts = [...products, ...products];

  return (
    <Container className="py-16">
      <div className="mb-11 flex flex-wrap items-end justify-between gap-8">
        <SectionHeading
          eyebrow={t.home.catalog.eyebrow}
          title={t.home.catalog.title}
          subtitle={t.home.catalog.subtitle}
        />
        <div className="flex items-center gap-4">
          <Link href="/san-pham" className="border-b border-line pb-1 text-[14.5px] font-semibold text-accent">
            {t.home.catalog.viewAll}
          </Link>
          <MarqueeToggle
            paused={paused}
            onToggle={() => setPaused((p) => !p)}
            pauseLabel={t.common.pauseCarousel}
            playLabel={t.common.playCarousel}
          />
        </div>
      </div>

      <div className="scrollbar-hide overflow-hidden py-1.5 pb-6.5">
        <div
          className="marquee-track animate-marquee flex w-max gap-5.5"
          style={paused ? { animationPlayState: "paused" } : undefined}
        >
          {loopedProducts.map((product, i) => {
            const copy = t.products[product.id];
            return (
              <article
                key={`${product.id}-${i}`}
                aria-hidden={i >= products.length}
                className="relative z-[1] flex w-80 flex-shrink-0 flex-col overflow-hidden rounded-card border border-line bg-card transition-all duration-400 hover:z-[5] hover:-translate-y-4 hover:scale-[1.06] hover:shadow-[0_32px_54px_rgba(18,41,42,0.24)]"
              >
                <div className="flex aspect-square items-center justify-center bg-wash p-7.5">
                  <Image
                    src={product.image}
                    alt={copy.name}
                    width={260}
                    height={260}
                    className="h-full w-full object-contain mix-blend-multiply"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2.5 p-5.5">
                  <span className="text-[11px] font-semibold tracking-[0.14em] text-accent-2 uppercase">
                    {copy.tag}
                  </span>
                  <h3 className="text-[17px] leading-[1.35] font-semibold">{copy.name}</h3>
                  <p className="flex-1 text-sm leading-[1.65] text-ink-2">{copy.descShort}</p>
                  <Link href="/san-pham" className="mt-1.5 text-sm font-semibold">
                    {t.home.catalog.viewDetails}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </Container>
  );
}
