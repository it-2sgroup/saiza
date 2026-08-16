"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import { SaizaLogo } from "@/components/ui/SaizaLogo";

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

export function Footer() {
  const { t, locale } = useLanguage();

  return (
    <footer className="relative overflow-hidden bg-ink text-white/68">
      <div className="absolute top-0 right-0 left-0 h-[3px] bg-gradient-to-r from-accent-2 via-accent to-transparent" />
      <Container className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-10 pt-19 pb-8">
        <div className="flex flex-col gap-4.5">
          <div className="flex items-center gap-3">
            <SaizaLogo tone="light" className="text-2xl" />
          </div>
          <p className="max-w-[26ch] text-[15.5px] leading-[1.6] text-white/55 italic">{t.footer.tagline}</p>
          <div className="mt-1 flex gap-2.5">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.title}
                href={social.href}
                title={social.title}
                aria-label={social.title}
                className="flex h-9.5 w-9.5 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-accent-2 hover:bg-accent-2"
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
              className="flex h-9.5 w-9.5 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-accent-2 hover:bg-accent-2"
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
          <Link href="/gioi-thieu" className="w-fit text-sm transition-all hover:translate-x-[3px] hover:text-white">
            {t.nav.about}
          </Link>
          <Link href="/doi-tac-dai-ly" className="w-fit text-sm transition-all hover:translate-x-[3px] hover:text-white">
            {t.nav.partners}
          </Link>
          <Link href="/tin-tuc" className="w-fit text-sm transition-all hover:translate-x-[3px] hover:text-white">
            {t.nav.news}
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
              className="w-fit text-sm transition-all hover:translate-x-[3px] hover:text-white"
            >
              {link.label[locale]}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3.5">
          <h3 className="mb-0.5 border-b border-white/14 pb-2.5 text-[12.5px] tracking-[0.14em] text-white uppercase">
            {t.footer.contactHeading}
          </h3>
          <span className="text-sm font-semibold text-white">0946 010 818</span>
          <span className="text-sm">2sgrouprecruitment@gmail.com</span>
          <span className="text-[13.5px] leading-[1.6]">VP1: 131 Đường số 1A, KDC Nam Hùng Vương, P. An Lạc, Q. Bình Tân</span>
          <span className="text-[13.5px] leading-[1.6]">VP2: Số 4, Đường Mỹ Đa Tây 9, P. Ngũ Hành Sơn, Đà Nẵng</span>
        </div>
      </Container>

      <Container className="flex flex-wrap justify-between gap-2.5 border-t border-white/12 pt-5.5 pb-9 text-[12.5px] text-white/60">
        <span>{t.footer.copyright}</span>
        <span>{t.footer.credit}</span>
      </Container>
    </footer>
  );
}
