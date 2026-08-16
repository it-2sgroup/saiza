"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { NAV_ITEMS } from "@/lib/nav";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";

export function Header() {
  const { t, locale, setLocale } = useLanguage();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-line bg-paper/92 backdrop-blur-[14px] transition-shadow duration-300 ${
        scrolled ? "shadow-[0_10px_26px_rgba(18,41,42,0.08)]" : ""
      }`}
    >
      <Container className="flex items-center gap-7 py-4">
        <Link href="/" className="flex flex-shrink-0 items-center gap-3">
          <span className="block h-11 w-11 flex-shrink-0 overflow-hidden rounded-[10px]">
            <Image
              src="https://2sgroup.vn/wp-content/uploads/2025/04/z6468514907637_ecd5cd7fff737752f6878aa68969247b-1-1024x1024.jpg"
              alt="2S Group"
              width={44}
              height={44}
              className="h-full w-full object-cover"
            />
          </span>
          <span className="flex flex-col leading-[1.1]">
            <span className="text-xl font-semibold tracking-[-0.01em]">2S Group</span>
            <span className="text-[10px] tracking-[0.16em] text-ink-2 uppercase">Since 2023</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setNavOpen((open) => !open)}
          aria-label="Toggle menu"
          aria-expanded={navOpen}
          className="ml-auto flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] hover:bg-wash min-[1180px]:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>

        <nav className="ml-auto hidden flex-wrap items-center gap-6.5 text-[14.5px] font-medium min-[1180px]:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`hover:opacity-62 ${pathname === item.href ? "text-accent" : "text-ink"}`}
            >
              {t.nav[item.key]}
            </Link>
          ))}
        </nav>

        <div className="hidden flex-shrink-0 items-center gap-3.5 min-[1180px]:flex">
          <LanguageToggle locale={locale} setLocale={setLocale} />
          <LinkButton href="/lien-he" shake className="px-5 py-[11px] text-sm">
            {t.nav.cta}
          </LinkButton>
        </div>
      </Container>

      {navOpen && (
        <div className="flex flex-col gap-1 border-t border-line bg-card px-8 pt-4.5 pb-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setNavOpen(false)}
              className={`px-1 py-3 text-[15.5px] font-medium ${pathname === item.href ? "text-accent" : "text-ink"}`}
            >
              {t.nav[item.key]}
            </Link>
          ))}
          <div className="mt-3 flex items-center justify-between gap-3.5 border-t border-line pt-4">
            <LanguageToggle locale={locale} setLocale={setLocale} />
            <LinkButton href="/lien-he" className="px-5 py-[11px] text-sm" onClick={() => setNavOpen(false)}>
              {t.nav.cta}
            </LinkButton>
          </div>
        </div>
      )}
    </header>
  );
}

function LanguageToggle({
  locale,
  setLocale,
}: {
  locale: "vi" | "en";
  setLocale: (locale: "vi" | "en") => void;
}) {
  return (
    <div className="flex rounded-full border border-line p-[3px] text-xs font-semibold">
      <button
        type="button"
        onClick={() => setLocale("vi")}
        className={`rounded-full px-[11px] py-[5px] ${locale === "vi" ? "bg-ink text-white" : "text-ink-2"}`}
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rounded-full px-[11px] py-[5px] ${locale === "en" ? "bg-ink text-white" : "text-ink-2"}`}
      >
        EN
      </button>
    </div>
  );
}
