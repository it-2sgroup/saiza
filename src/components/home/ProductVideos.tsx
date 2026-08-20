"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function ProductVideos({ videoIds }: { videoIds: string[] }) {
  const { t } = useLanguage();

  return (
    <Container className="pt-30">
      <SectionHeading eyebrow={t.home.videos.eyebrow} title={t.home.videos.title} size="md" className="mb-9" />
      <div className="mx-auto grid max-w-[1100px] grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-12 pb-30">
        {videoIds.map((id) => (
          <div key={id} className="aspect-[9/16] overflow-hidden rounded-card bg-wash">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube-nocookie.com/embed/${id}`}
              title={t.home.videos.title}
              className="block border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        ))}
      </div>
    </Container>
  );
}
