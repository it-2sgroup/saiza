"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { promoBanners } from "@/lib/data/promoBanners";

export function PromoBanners() {
  const { t } = useLanguage();

  return (
    <Container className="py-16">
      <SectionHeading eyebrow={t.home.promo.eyebrow} title={t.home.promo.title} size="md" className="mb-8" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {promoBanners.map((banner) => (
          <Link
            key={banner.id}
            href={banner.href}
            className="group relative block aspect-[4/3] overflow-hidden rounded-card border border-line shadow-[0_8px_30px_rgba(22,33,62,0.08)] transition-shadow duration-300 hover:shadow-[0_20px_44px_rgba(22,33,62,0.18)]"
          >
            <Image
              src={banner.image}
              alt={banner.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </Link>
        ))}
      </div>
    </Container>
  );
}
