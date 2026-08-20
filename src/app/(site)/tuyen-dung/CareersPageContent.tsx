"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import type { JobPost } from "@/lib/admin/types";

export function CareersPageContent({ jobs }: { jobs: JobPost[] }) {
  const { t } = useLanguage();

  return (
    <Container className="pt-32 pb-24">
      <div className="mb-12 flex max-w-[680px] flex-col gap-4">
        <span className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          {t.careersPage.eyebrow}
        </span>
        <h1 className="text-[clamp(34px,4vw,54px)] leading-[1.1] font-medium tracking-[-0.02em]">
          {t.careersPage.title}
        </h1>
        <p className="text-[16.5px] leading-[1.8] text-ink-2">{t.careersPage.subtitle}</p>
      </div>

      {jobs.length === 0 ? (
        <p className="text-ink-2">{t.careersPage.noResults}</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => {
            const tags = [job.department, job.location, job.employment_type].filter(Boolean) as string[];
            return (
              <Link
                key={job.id}
                href={`/tuyen-dung/${job.slug}`}
                className="flex flex-col gap-3.5 rounded-card border border-line bg-card p-6 transition-all duration-300 ease-soft hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(22,33,62,0.1)]"
              >
                <h2 className="text-lg leading-[1.35] font-semibold">{job.title}</h2>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-wash px-3 py-1 text-xs font-medium text-ink-2">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {job.salary_note && <p className="text-sm text-ink-2">{job.salary_note}</p>}
                <span className="mt-1 text-sm font-semibold text-accent">{t.careersPage.viewDetails} →</span>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}
