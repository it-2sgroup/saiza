"use client";

import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { MarqueeToggle } from "@/components/ui/MarqueeToggle";
import { kolList } from "@/lib/data/kol";

export function KolSection() {
  const { t } = useLanguage();
  const [paused, setPaused] = useState(false);
  const loopedKol = [...kolList, ...kolList];

  return (
    <Container className="py-30">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-8">
        <SectionHeading eyebrow={t.home.kol.eyebrow} title={t.home.kol.title} subtitle={t.home.kol.subtitle} />
        <MarqueeToggle
          paused={paused}
          onToggle={() => setPaused((p) => !p)}
          pauseLabel={t.common.pauseCarousel}
          playLabel={t.common.playCarousel}
        />
      </div>
      <div className="scrollbar-hide overflow-hidden">
        <div
          className="marquee-track animate-marquee-fast flex w-max gap-4.5"
          style={{ perspective: "700px", ...(paused ? { animationPlayState: "paused" } : {}) }}
        >
          {loopedKol.map((kol, i) => (
            <figure
              key={`${kol.name}-${i}`}
              aria-hidden={i >= kolList.length}
              className="relative m-0 aspect-[3/4] w-50 flex-shrink-0 overflow-hidden rounded-2xl bg-wash transition-transform duration-400 [transition-timing-function:cubic-bezier(0.22,0.68,0,1)] hover:z-[2] hover:-translate-y-2 hover:scale-105 hover:[transform:translateY(-8px)_rotateX(4deg)_rotateY(-6deg)_scale(1.05)] hover:shadow-[0_22px_34px_rgba(18,41,42,0.28)]"
            >
              <Image src={kol.image} alt={kol.name} fill className="object-cover" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,rgba(18,41,42,0.82),transparent)] p-4 text-[14.5px] font-semibold text-white">
                {kol.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </Container>
  );
}
