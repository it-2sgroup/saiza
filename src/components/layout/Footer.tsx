"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import { SaizaLogo } from "@/components/ui/SaizaLogo";
import { LinkButton } from "@/components/ui/Button";

const PRODUCT_LINKS = [
  { key: "drum-cleaner", label: { vi: "Bột vệ sinh lồng giặt", en: "Drum cleaner" } },
  { key: "multi-cleaner", label: { vi: "Tẩy đa năng", en: "Multi-purpose cleaner" } },
  { key: "bathroom-spray", label: { vi: "Xịt vệ sinh nhà tắm", en: "Bathroom spray" } },
  { key: "kitchen-spray", label: { vi: "Xịt tẩy bếp đa năng", en: "Kitchen spray" } },
  { key: "fridge-spray", label: { vi: "Xịt tủ lạnh SU", en: "SU fridge spray" } },
  { key: "delicate-wash", label: { vi: "Nước giặt đồ lót", en: "Delicate wash" } },
] as const;

const SOCIAL_LINKS = [
  {
    title: "Facebook",
    href: "#",
    path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
  },
];

const CONTACT_ICONS = {
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  mail: "M4 4h16v16H4V4Z M22 6l-10 7L2 6",
  pin: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
};

function ContactIcon({ path }: { path: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

export function Footer() {
  const { t, locale } = useLanguage();

  return (
    <footer className="relative overflow-hidden bg-ink text-white/68">
      <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-highlight via-accent-2 to-transparent" />
      <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-accent-2/25 blur-[100px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-highlight/15 blur-[100px]" aria-hidden="true" />

      <Container className="relative pt-14">
        <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl bg-gradient-to-r from-accent to-accent-2 px-8 py-9 text-center shadow-[0_24px_48px_rgba(9,26,27,0.35)] sm:flex-row sm:justify-between sm:text-left">
          <div
            className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-highlight/25 blur-[60px]"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-1.5">
            <h2 className="text-[22px] leading-[1.25] font-medium text-white sm:text-[26px]">{t.footer.ctaTitle}</h2>
            <p className="max-w-[440px] text-[14.5px] leading-[1.6] text-white/78">{t.footer.ctaSubtitle}</p>
          </div>
          <LinkButton href="/lien-he" variant="light" className="relative flex-shrink-0">
            {t.footer.ctaButton}
          </LinkButton>
        </div>
      </Container>

      <Container className="relative grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-10 pt-14 pb-8">
        <div className="flex flex-col gap-4.5">
          <div className="flex items-center gap-3">
            <SaizaLogo tone="light" className="h-13" />
          </div>
          <p className="max-w-[26ch] text-[15.5px] leading-[1.6] text-white/55 italic">{t.footer.tagline}</p>
          <div className="mt-1 flex gap-2.5">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.title}
                href={social.href}
                title={social.title}
                aria-label={social.title}
                className="flex h-9.5 w-9.5 items-center justify-center rounded-full border border-white/20 bg-white/5 transition-all duration-300 hover:-translate-y-[2px] hover:border-accent-2 hover:bg-accent-2"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={social.path} />
                </svg>
              </a>
            ))}
            <a
              href="https://www.tiktok.com/@2sgroup"
              target="_blank"
              rel="noopener"
              title="TikTok"
              aria-label="TikTok"
              className="flex h-9.5 w-9.5 items-center justify-center rounded-full border border-white/20 bg-white/5 transition-all duration-300 hover:-translate-y-[2px] hover:border-accent-2 hover:bg-accent-2"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <h3 className="mb-0.5 border-b border-white/14 pb-2.5 text-[12.5px] tracking-[0.14em] text-white uppercase">
            {t.footer.aboutHeading}
          </h3>
          <Link href="/gioi-thieu" className="w-fit text-sm transition-all hover:translate-x-[3px] hover:text-accent-2">
            {t.nav.about}
          </Link>
          <Link href="/doi-tac-dai-ly" className="w-fit text-sm transition-all hover:translate-x-[3px] hover:text-accent-2">
            {t.nav.partners}
          </Link>
          <Link href="/tin-tuc" className="w-fit text-sm transition-all hover:translate-x-[3px] hover:text-accent-2">
            {t.nav.news}
          </Link>
          <Link href="/tuyen-dung" className="w-fit text-sm transition-all hover:translate-x-[3px] hover:text-accent-2">
            {t.nav.careers}
          </Link>
        </div>

        <div className="flex flex-col gap-3.5">
          <h3 className="mb-0.5 border-b border-white/14 pb-2.5 text-[12.5px] tracking-[0.14em] text-white uppercase">
            {t.footer.productsHeading}
          </h3>
          {PRODUCT_LINKS.map((link) => (
            <Link
              key={link.key}
              href="/san-pham"
              className="w-fit text-sm transition-all hover:translate-x-[3px] hover:text-accent-2"
            >
              {link.label[locale]}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="mb-0.5 border-b border-white/14 pb-2.5 text-[12.5px] tracking-[0.14em] text-white uppercase">
            {t.footer.contactHeading}
          </h3>
          <a href="tel:0946010818" className="flex items-center gap-3 text-sm font-semibold text-white transition-colors hover:text-accent-2">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-accent-2">
              <ContactIcon path={CONTACT_ICONS.phone} />
            </span>
            0946 010 818
          </a>
          <a
            href="mailto:2sgrouprecruitment@gmail.com"
            className="flex items-center gap-3 text-sm transition-colors hover:text-accent-2"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-accent-2">
              <ContactIcon path={CONTACT_ICONS.mail} />
            </span>
            2sgrouprecruitment@gmail.com
          </a>
          <div className="flex items-start gap-3 text-[13.5px] leading-[1.6]">
            <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-accent-2">
              <ContactIcon path={CONTACT_ICONS.pin} />
            </span>
            <span>VP1: 131 Đường số 1A, KDC Nam Hùng Vương, P. An Lạc, Q. Bình Tân</span>
          </div>
          <div className="flex items-start gap-3 text-[13.5px] leading-[1.6]">
            <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-accent-2">
              <ContactIcon path={CONTACT_ICONS.pin} />
            </span>
            <span>VP2: Số 4, Đường Mỹ Đa Tây 9, P. Ngũ Hành Sơn, Đà Nẵng</span>
          </div>
        </div>
      </Container>

      <Container className="relative flex flex-wrap justify-between gap-2.5 border-t border-white/12 pt-5.5 pb-9 text-[12.5px] text-white/60">
        <span>{t.footer.copyright}</span>
        <span>{t.footer.credit}</span>
      </Container>
    </footer>
  );
}
