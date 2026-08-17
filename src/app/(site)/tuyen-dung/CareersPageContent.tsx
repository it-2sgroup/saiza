"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import type { JobPost } from "@/lib/admin/types";

const RECRUITMENT_EMAIL = "2sgrouprecruitment@gmail.com";

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
        <div className="flex flex-col gap-5">
          {jobs.map((job) => (
            <div key={job.id} className="flex flex-col gap-4 rounded-card border border-line bg-card p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <h2 className="text-xl font-semibold">{job.title}</h2>
                  <p className="text-sm text-ink-2">
                    {[job.department, job.location, job.employment_type, job.salary_note]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <a
                  href={`mailto:${RECRUITMENT_EMAIL}?subject=${encodeURIComponent(`Ứng tuyển: ${job.title}`)}`}
                  className="flex-shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink"
                >
                  {t.careersPage.applyCta}
                </a>
              </div>
              <p className="text-[15px] leading-[1.75] whitespace-pre-line text-ink-2">{job.description}</p>
              {job.requirements && (
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-sm font-semibold">Yêu cầu</h3>
                  <p className="text-[15px] leading-[1.75] whitespace-pre-line text-ink-2">{job.requirements}</p>
                </div>
              )}
              {job.benefits && (
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-sm font-semibold">Quyền lợi</h3>
                  <p className="text-[15px] leading-[1.75] whitespace-pre-line text-ink-2">{job.benefits}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
