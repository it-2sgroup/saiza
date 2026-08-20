"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { JobPost } from "@/lib/admin/types";

function linesOf(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function BulletCard({ title, text }: { title: string; text: string }) {
  const lines = linesOf(text);
  if (lines.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-card p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      <ul className="flex flex-col gap-2">
        {lines.map((line) => (
          <li key={line} className="flex items-start gap-2.5 text-[14.5px] leading-[1.65] text-ink-2">
            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function JobDetailContent({ job, applyFormUrl }: { job: JobPost; applyFormUrl: string }) {
  const { t } = useLanguage();

  const infoRows = [
    { label: t.careersPage.positionLabel, value: job.title },
    { label: t.careersPage.departmentLabel, value: job.department },
    { label: t.careersPage.locationLabel, value: job.location },
    { label: t.careersPage.employmentTypeLabel, value: job.employment_type },
    { label: t.careersPage.salaryLabel, value: job.salary_note },
  ].filter((row) => row.value) as { label: string; value: string }[];

  return (
    <>
      <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-ink-2">
        <Link href="/" className="hover:text-accent">
          {t.nav.home}
        </Link>
        <span>/</span>
        <Link href="/tuyen-dung" className="hover:text-accent">
          {t.nav.careers}
        </Link>
        <span>/</span>
        <span className="text-ink">{job.title}</span>
      </nav>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
        <h1 className="text-[clamp(28px,3.6vw,44px)] leading-[1.15] font-medium tracking-[-0.02em]">{job.title}</h1>
        <a
          href="#apply-form"
          className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white whitespace-nowrap transition-all duration-300 hover:-translate-y-[3px] hover:bg-ink active:translate-y-0 active:scale-[0.97]"
        >
          {t.careersPage.applyCta}
        </a>
      </div>

      {infoRows.length > 0 && (
        <div className="mb-8 overflow-hidden rounded-card border border-line">
          <table className="w-full border-collapse text-[14.5px]">
            <tbody>
              {infoRows.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? "bg-wash" : ""}>
                  <td className="w-1/3 px-5 py-3 font-semibold">{row.label}</td>
                  <td className="px-5 py-3 text-ink-2">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {job.description && (
        <div className="mb-6 flex flex-col gap-3 rounded-card border border-line bg-card p-6">
          <h2 className="text-base font-semibold">{t.careersPage.descriptionLabel}</h2>
          <p className="text-[14.5px] leading-[1.7] whitespace-pre-line text-ink-2">{job.description}</p>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <BulletCard title={t.careersPage.requirementsLabel} text={job.requirements} />
        <BulletCard title={t.careersPage.benefitsLabel} text={job.benefits} />
      </div>

      <div id="apply-form" className="flex flex-col gap-3 border-t border-line pt-8">
        <h2 className="text-lg font-semibold">{t.careersPage.applyCta}</h2>
        <div className="overflow-hidden rounded-card border border-line bg-card">
          <iframe
            src={applyFormUrl}
            title={`${t.careersPage.applyCta} — ${job.title}`}
            loading="lazy"
            className="h-[900px] w-full"
          />
        </div>
        <a
          href={applyFormUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit text-sm text-ink-2 underline hover:text-accent"
        >
          {t.careersPage.applyFormFallback}
        </a>
      </div>
    </>
  );
}
