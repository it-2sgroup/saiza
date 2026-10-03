"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import { formatVnd, type Campaign, type CampaignStatus } from "@/lib/content/campaigns";

export function ActivitiesPageContent({ campaigns }: { campaigns: Campaign[] }) {
  const { t, locale } = useLanguage();

  return (
    <Container className="pt-32 pb-24">
      <div className="mb-12 flex max-w-[680px] flex-col gap-4">
        <span className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
          {t.activitiesPage.eyebrow}
        </span>
        <h1 className="text-[clamp(34px,4vw,54px)] leading-[1.1] font-medium tracking-[-0.02em]">
          {t.activitiesPage.title}
        </h1>
        <p className="text-[16.5px] leading-[1.8] text-ink-2">{t.activitiesPage.subtitle}</p>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-ink-2">{t.activitiesPage.empty}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {campaigns.map((c) => (
            <Link
              key={c.slug}
              href={`/hoat-dong/${c.slug}`}
              className="group relative flex flex-col justify-between gap-8 overflow-hidden rounded-card bg-ink p-9 text-white transition-all duration-300 ease-soft hover:-translate-y-1.5 hover:shadow-[0_28px_60px_rgba(22,33,62,0.28)]"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 -right-20 h-[320px] w-[320px] rounded-full bg-accent-2/20 blur-[100px] transition-opacity duration-500 group-hover:opacity-70"
              />

              <div className="relative flex flex-col gap-5">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={c.status} />
                  <span className="text-[11.5px] font-semibold tracking-[0.16em] text-white/40 uppercase">
                    {c.eyebrow[locale]}
                  </span>
                </div>
                <h2 className="max-w-[420px] text-[clamp(24px,2.6vw,32px)] leading-[1.12] font-medium tracking-[-0.025em]">
                  {c.name[locale]}
                </h2>
                <p className="max-w-[460px] text-[15px] leading-[1.75] text-white/60">
                  {c.summary[locale]}
                </p>
              </div>

              <div className="relative flex flex-wrap items-end justify-between gap-5 border-t border-white/12 pt-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium tracking-[0.12em] text-white/40 uppercase">
                    {t.activitiesPage.topPrizeLabel}
                  </span>
                  <span className="text-[26px] leading-none font-semibold tracking-[-0.03em]">
                    {formatVnd(topPrizeAmount(c))}đ
                  </span>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[14px] font-semibold text-ink transition-colors duration-300 group-hover:bg-[#D7E3F5]">
                  {t.activitiesPage.viewDetails}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}

/** Mệnh giá của giải cao nhất — thay cho tổng giá trị giải thưởng, vốn đã bỏ
 *  khỏi phần hiển thị (xem ghi chú ở Campaign.totalPrizeValue). */
function topPrizeAmount(c: Campaign): number {
  return c.prizes.find((p) => p.tone === "top")?.amount ?? 0;
}

function StatusBadge({ status }: { status: CampaignStatus }) {
  const { t } = useLanguage();

  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[12px] font-semibold text-emerald-300">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        {t.activitiesPage.statusRunning}
      </span>
    );
  }

  return (
    <span className="rounded-full border border-white/20 px-3 py-1 text-[12px] font-semibold text-white/55">
      {status === "upcoming" ? t.activitiesPage.statusUpcoming : t.activitiesPage.statusEnded}
    </span>
  );
}
