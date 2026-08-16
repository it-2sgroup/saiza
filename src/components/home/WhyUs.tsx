"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";

export function WhyUs() {
  const { t } = useLanguage();

  return (
    <section className="bg-ink text-white">
      <Container className="grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] items-center gap-14 py-30">
        <div className="aspect-[5/4] overflow-hidden rounded-card">
          <Image
            src="/images/why-choose-lab.png"
            alt={t.home.whyUs.title}
            width={640}
            height={512}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-8.5">
          <div className="flex flex-col gap-3.5">
            <span className="text-xs font-semibold tracking-[0.18em] text-white/55 uppercase">
              {t.home.whyUs.eyebrow}
            </span>
            <h2 className="text-[clamp(30px,3.4vw,44px)] leading-[1.14] font-medium tracking-[-0.015em]">
              {t.home.whyUs.title}
            </h2>
          </div>
          <div className="flex flex-col">
            {t.home.whyUs.items.map((item, i) => (
              <div
                key={item.number}
                className={`grid grid-cols-[44px_1fr] gap-5 border-t border-white/14 py-6 ${
                  i === t.home.whyUs.items.length - 1 ? "border-b" : ""
                }`}
              >
                <span className="text-[15px] text-accent-2">{item.number}</span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-[17px] font-semibold">{item.title}</h3>
                  <p className="text-[14.5px] leading-[1.7] text-white/66">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
