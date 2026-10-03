"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { WaveDivider } from "@/components/ui/WaveDivider";
import { ScratchCard } from "@/components/campaigns/ScratchCard";
import { RulesAccordion } from "@/components/campaigns/RulesAccordion";
import { formatVnd, type Campaign, type CampaignStatus } from "@/lib/content/campaigns";

const RULES_ANCHOR = "the-le";

// Lớp nền của hero và của section giải thưởng dùng chung một bảng màu, nên
// nút CTA ngoài (link TikTok Shop) phải tự dựng class thay vì dùng LinkButton:
// LinkButton bọc next/link nên không mở tab mới được.
const CTA_BASE =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-7 py-[15px] text-[15px] font-semibold whitespace-nowrap transition-all duration-300 hover:-translate-y-[3px] active:translate-y-0 active:scale-[0.97]";

export function CampaignDetailContent({ campaign }: { campaign: Campaign }) {
  const { t, locale } = useLanguage();
  const c = campaign;

  const name = c.name[locale];
  const accent = c.nameAccent[locale];
  // nameAccent luôn là hậu tố của name (xem type Campaign) — tách ra để tô màu
  // riêng phần đuôi mà không phải nhân đôi chuỗi trong file nội dung.
  const nameHead = name.endsWith(accent) ? name.slice(0, name.length - accent.length) : name;
  const showAccent = nameHead !== name;

  const topPrize = c.prizes.find((p) => p.tone === "top");
  const otherCash = c.prizes.filter((p) => p.tone === "cash");
  // Các dòng tone "muted" (thẻ hiện kim >1000, "chúc may mắn lần sau" >814)
  // cố ý không render: chúng chỉ tồn tại để thống kê số lượng, mà số lượng là
  // thứ đã bỏ khỏi trang theo yêu cầu marketing.

  return (
    <>
      {/* ——— Hero ——— */}
      <section className="relative overflow-hidden bg-ink pt-32 pb-20 text-white">
        <Glow />
        <Container className="relative">
          <Link
            href="/hoat-dong"
            className="inline-flex items-center gap-2 text-[13.5px] font-medium text-white/55 transition-colors duration-200 hover:text-white"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
            {t.campaignPage.backToList}
          </Link>

          <div className="mt-7 grid items-center gap-14 lg:grid-cols-[1fr_auto]">
            <div className="flex max-w-[640px] flex-col items-start gap-6">
              <StatusPill status={c.status} />

              <div className="flex flex-col gap-4">
                <span className="text-xs font-semibold tracking-[0.18em] text-accent-2 uppercase">
                  {c.eyebrow[locale]}
                </span>
                <h1 className="text-[clamp(36px,5vw,62px)] leading-[1.04] font-medium tracking-[-0.03em]">
                  {nameHead}
                  {showAccent && (
                    <span className="bg-gradient-to-r from-[#8fd0ff] to-[#f88aaf] bg-clip-text text-transparent">
                      {accent}
                    </span>
                  )}
                </h1>
                <p className="max-w-[560px] text-[16.5px] leading-[1.8] text-white/65">
                  {c.tagline[locale]}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <HeroStat
                  label={t.campaignPage.topPrizeLabel}
                  value={`${formatVnd(topPrize?.amount ?? 0)}đ`}
                />
                <HeroStat label={t.campaignPage.payoutLabel} value={t.campaignPage.payoutValue} />
              </div>

              <div className="mt-1 flex flex-wrap gap-3">
                <a
                  href={c.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${CTA_BASE} bg-white text-ink hover:bg-[#D7E3F5]`}
                >
                  {t.campaignPage.ctaBuy}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </a>
                <a href={`#${RULES_ANCHOR}`} className={`${CTA_BASE} border border-white/45 text-white hover:border-white hover:bg-white/10`}>
                  {t.campaignPage.ctaRules}
                </a>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <ScratchCard
                amountLabel={`${formatVnd(topPrize?.amount ?? 500_000)}đ`}
                codeLabel="SAIZA-500K"
                brandLabel={t.campaignPage.scratchTitle}
                scratchLabel={locale === "vi" ? "Cào lớp bạc" : "Scratch here"}
                hint={t.campaignPage.scratchHint}
                revealedNote={t.campaignPage.scratchRevealed}
                againLabel={t.campaignPage.scratchAgain}
                demoLabel={t.campaignPage.scratchDemoNote}
              />
            </div>
          </div>
        </Container>
      </section>

      <WaveDivider topClassName="bg-ink" fill="var(--color-paper)" />

      {/* ——— Thông tin then chốt ——— */}
      <Container className="pt-4 pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          <FactCard label={t.campaignPage.periodLabel} value={c.period[locale]} icon="calendar" />
          <FactCard label={t.campaignPage.redeemLabel} value={c.redeemWindow[locale]} icon="clock" />
          <FactCard label={t.campaignPage.organizerLabel} value={c.organizer[locale]} icon="building" />
        </div>
      </Container>

      {/* ——— Cách tham gia ——— */}
      <Container className="pb-24">
        <SectionHeading
          eyebrow={t.campaignPage.stepsEyebrow}
          title={t.campaignPage.stepsTitle}
          size="md"
          className="mb-12"
        />
        <ol className="relative grid gap-y-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-6">
          {/* Đường nối giữa 4 bước — chỉ ở desktop, nơi các bước nằm thành một hàng. */}
          <span
            aria-hidden="true"
            className="absolute top-7 right-[12.5%] left-[12.5%] hidden border-t-2 border-dashed border-line lg:block"
          />
          {c.steps.map((step, i) => (
            <li key={i} className="relative flex flex-col items-start gap-4 lg:items-center lg:px-3 lg:text-center">
              <span className="relative z-10 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-line bg-card text-accent shadow-[0_8px_24px_rgba(22,33,62,0.08)]">
                <StepIcon index={i} />
              </span>
              <div className="flex flex-col gap-2 lg:items-center">
                <span className="text-xs font-semibold tracking-[0.16em] text-accent-2 uppercase">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-[17px] leading-snug font-semibold">{step.title[locale]}</h3>
                <p className="max-w-[260px] text-[14.5px] leading-[1.7] text-ink-2">{step.desc[locale]}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>

      {/* ——— Cơ cấu giải thưởng ——— */}
      <section className="bg-wash py-24">
        <Container>
          <SectionHeading
            eyebrow={t.campaignPage.prizesEyebrow}
            title={t.campaignPage.prizesTitle}
            size="md"
            className="mb-12"
          />

          <div className="grid gap-5 lg:grid-cols-[1.1fr_1.4fr]">
            {topPrize && (
              <div className="relative flex flex-col justify-between gap-8 overflow-hidden rounded-card bg-ink p-9 text-white">
                <Glow subtle />
                <div className="relative flex items-center gap-2.5">
                  <span className="rounded-full bg-[#f88aaf] px-3 py-1 text-[11px] font-semibold tracking-[0.1em] text-ink uppercase">
                    {t.campaignPage.prizeTopBadge}
                  </span>
                </div>
                <div className="relative flex flex-col gap-3">
                  <span className="bg-gradient-to-r from-white via-[#bcdcff] to-[#f88aaf] bg-clip-text text-[clamp(52px,7vw,84px)] leading-[0.95] font-semibold tracking-[-0.04em] text-transparent">
                    {formatVnd(topPrize.amount ?? 0)}đ
                  </span>
                  <span className="text-[14.5px] leading-[1.7] text-white/60">
                    {topPrize.label[locale]}
                  </span>
                </div>
              </div>
            )}

            {/* Chỉ còn mệnh giá, không còn số lượng mỗi giải — nên mỗi ô chỉ
                có một con số, để nó to và thoáng thay vì nhồi thêm chữ cho đầy. */}
            <div className="grid grid-cols-2 gap-4">
              {otherCash.map((p) => (
                <div
                  key={String(p.amount)}
                  className="flex items-center justify-center rounded-[18px] border border-line bg-card px-6 py-9 transition-all duration-300 ease-soft hover:-translate-y-1 hover:border-accent/30 hover:shadow-[0_18px_38px_rgba(22,33,62,0.1)]"
                >
                  <span className="text-[clamp(28px,3.2vw,38px)] leading-none font-semibold tracking-[-0.03em] text-accent">
                    {formatVnd(p.amount ?? 0)}đ
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-[18px] border border-accent/20 bg-card px-7 py-5">
            <span className="text-[14px] text-ink-2">{c.prizeNote[locale]}</span>
          </div>
        </Container>
      </section>

      {/* ——— Sản phẩm áp dụng ——— */}
      <Container className="py-24">
        <SectionHeading
          eyebrow={t.campaignPage.comboEyebrow}
          title={t.campaignPage.comboTitle}
          subtitle={c.comboNote[locale]}
          size="md"
          className="mb-12"
        />
        <div className="grid gap-5 sm:grid-cols-3">
          {c.comboTiers.map((tier, i) => {
            const best = i === c.comboTiers.length - 1;
            return (
              <div
                key={tier.combo}
                className={`relative flex flex-col gap-5 rounded-card border p-8 transition-all duration-300 ease-soft hover:-translate-y-1 ${
                  best
                    ? "border-accent/35 bg-card shadow-[0_18px_44px_rgba(29,95,184,0.14)]"
                    : "border-line bg-card"
                }`}
              >
                {best && (
                  <span className="absolute -top-3 left-8 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-white uppercase">
                    {t.campaignPage.comboBestBadge}
                  </span>
                )}
                <span className="text-[15px] font-semibold text-ink-2">{tier.label[locale]}</span>
                <div className="flex items-end gap-2">
                  <span className="text-[clamp(44px,5vw,58px)] leading-[0.9] font-semibold tracking-[-0.04em] text-accent">
                    {tier.cards}
                  </span>
                  <span className="pb-1.5 text-[14px] font-medium text-ink-2">
                    {t.campaignPage.comboCardsUnit}
                  </span>
                </div>
                <div className="flex gap-1.5" aria-hidden="true">
                  {Array.from({ length: tier.cards }).map((_, k) => (
                    <span key={k} className="h-1.5 w-9 rounded-full bg-accent-2" />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <a
            href={c.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${CTA_BASE} bg-ink text-white hover:bg-accent`}
          >
            {t.campaignPage.ctaBuy}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </a>
        </div>
      </Container>

      {/* ——— Thể lệ đầy đủ ——— */}
      <section id={RULES_ANCHOR} className="scroll-mt-28 border-t border-line bg-paper py-24">
        <Container>
          <SectionHeading
            eyebrow={t.campaignPage.rulesEyebrow}
            title={t.campaignPage.rulesTitle}
            subtitle={t.campaignPage.rulesSubtitle}
            size="md"
            className="mb-10"
          />
          <RulesAccordion
            sections={c.rules}
            locale={locale}
            expandAllLabel={t.campaignPage.rulesExpandAll}
            collapseAllLabel={t.campaignPage.rulesCollapseAll}
          />
          {locale === "en" && (
            <p className="mt-6 text-[13px] leading-relaxed text-ink-2/80">{t.campaignPage.legalPrevail}</p>
          )}
        </Container>
      </section>
    </>
  );
}

/* ——————————————————————— phụ trợ ——————————————————————— */

/** Quầng sáng nền cho các mảng nền ink — thuần trang trí. */
function Glow({ subtle = false }: { subtle?: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <span
        className={`absolute -top-28 -left-20 h-[420px] w-[420px] rounded-full bg-accent-2/20 blur-[110px] ${
          subtle ? "opacity-50" : ""
        }`}
      />
      <span
        className={`absolute -right-24 -bottom-32 h-[380px] w-[380px] rounded-full bg-[#f88aaf]/15 blur-[110px] ${
          subtle ? "opacity-50" : ""
        }`}
      />
    </div>
  );
}

function StatusPill({ status }: { status: CampaignStatus }) {
  const { t } = useLanguage();
  const label =
    status === "running"
      ? t.activitiesPage.statusRunning
      : status === "upcoming"
        ? t.activitiesPage.statusUpcoming
        : t.activitiesPage.statusEnded;

  if (status !== "running") {
    return (
      <span className="rounded-full border border-white/20 px-3.5 py-1.5 text-[12.5px] font-semibold text-white/60">
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2.5 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3.5 py-1.5 text-[12.5px] font-semibold text-emerald-300">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      {label}
    </span>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-white/12 bg-white/[0.06] px-5 py-3.5 backdrop-blur-sm">
      <span className="text-[11.5px] font-medium tracking-[0.1em] text-white/45 uppercase">{label}</span>
      <span className="text-[19px] font-semibold tracking-[-0.02em]">{value}</span>
    </div>
  );
}

const FACT_ICONS = {
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v15" />
      <path d="M15 11h3a2 2 0 0 1 2 2v8M3 21h18M8 8h3M8 12h3M8 16h3" />
    </>
  ),
} as const;

function FactCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof FACT_ICONS;
}) {
  return (
    <div className="flex items-start gap-4 rounded-card border border-line bg-card p-6">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-wash text-accent">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {FACT_ICONS[icon]}
        </svg>
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-[11.5px] font-semibold tracking-[0.12em] text-ink-2 uppercase">{label}</span>
        <span className="text-[15px] leading-[1.6] font-medium">{value}</span>
      </div>
    </div>
  );
}

const STEP_ICONS = [
  // 1 — thùng carton
  <>
    <path d="M3 8.5 12 4l9 4.5v7L12 20l-9-4.5v-7Z" />
    <path d="M3 8.5 12 13l9-4.5M12 13v7" />
  </>,
  // 2 — cào lớp bạc
  <>
    <path d="M4 16.5 14 6.5a2.5 2.5 0 0 1 3.5 3.5l-10 10H4v-3.5Z" />
    <path d="M18 3.5 19 2M21.5 6l1.5-.8M19.5 10.5l1.8.6" />
  </>,
  // 3 — mã QR
  <>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <path d="M14 14h3v3h-3zM20 14h1M14 20h3M20 18v3" />
  </>,
  // 4 — tin nhắn xác nhận
  <>
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-3.3A8.4 8.4 0 1 1 21 11.5Z" />
    <path d="m8.5 12 2.5 2.5L15.5 10" />
  </>,
];

function StepIcon({ index }: { index: number }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {STEP_ICONS[index % STEP_ICONS.length]}
    </svg>
  );
}
