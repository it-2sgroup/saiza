"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { OfficeLocations } from "@/components/shared/OfficeLocations";
import type { OfficeConfig } from "@/lib/content/site-config";

export function OfficeLocationsSection({ offices }: { offices: OfficeConfig[] }) {
  const { t } = useLanguage();

  return (
    <section className="border-t border-line">
      <Container className="py-30">
        <SectionHeading
          eyebrow={t.home.offices.eyebrow}
          title={t.home.offices.title}
          className="mb-8 max-w-[620px]"
        />
        <OfficeLocations offices={offices} />
      </Container>
    </section>
  );
}
