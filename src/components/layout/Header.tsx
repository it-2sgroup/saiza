"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { NAV_ITEMS } from "@/lib/nav";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { SaizaLogo } from "@/components/ui/SaizaLogo";
import { phoneToTelHref } from "@/lib/phone";

export function Header({ logoSrc, phone }: { logoSrc?: string; phone: string }) {
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
    <header className="fixed inset-x-0 top-0 z-50">
      <Container className={`transition-[padding] duration-300 ${scrolled ? "py-3" : "py-5"}`}>
        <div
          className={`flex items-center gap-7 rounded-full border border-white/50 bg-white/70 px-5 py-2.5 shadow-[0_8px_30px_rgba(22,33,62,0.10)] backdrop-blur-xl transition-shadow duration-300 ${
            scrolled ? "shadow-[0_12px_36px_rgba(22,33,62,0.16)]" : ""
          }`}
        >
          <Link href="/" className="flex flex-shrink-0 items-center gap-2">
            <SaizaLogo className="h-6.5" src={logoSrc} />
            <span className="mt-0.5 hidden self-start text-[10px] tracking-[0.16em] text-ink-2 uppercase sm:block">
              {t.common.since}
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setNavOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={navOpen}
            className="ml-auto flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full hover:bg-wash min-[1180px]:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>

          <nav className="ml-auto hidden flex-wrap items-center gap-1 text-[14px] font-medium min-[1180px]:flex">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`rounded-full px-3.5 py-2 transition-colors duration-200 ${
                    active ? "bg-wash text-accent" : "text-ink hover:bg-wash/70"
                  }`}
                >
                  {t.nav[item.key]}
                </Link>
              );
            })}
          </nav>

          <div className="hidden flex-shrink-0 items-center gap-3 min-[1180px]:flex">
            <LanguageToggle locale={locale} setLocale={setLocale} />
            <LinkButton href="/lien-he" shake className="px-5 py-[10px] text-sm">
              {t.nav.cta}
            </LinkButton>
          </div>
        </div>

        {navOpen && (
          <div className="mt-2 flex flex-col gap-1 rounded-3xl border border-white/50 bg-white/85 p-3 shadow-[0_12px_36px_rgba(22,33,62,0.16)] backdrop-blur-xl min-[1180px]:hidden">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setNavOpen(false)}
                  className={`rounded-2xl px-4 py-3 text-[15.5px] font-medium ${
                    active ? "bg-wash text-accent" : "text-ink"
                  }`}
                >
                  {t.nav[item.key]}
                </Link>
              );
            })}
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-line px-1 pt-4">
              <LanguageToggle locale={locale} setLocale={setLocale} />
              <LinkButton href="/lien-he" className="px-5 py-[10px] text-sm" onClick={() => setNavOpen(false)}>
                {t.nav.cta}
              </LinkButton>
            </div>
            <a href={phoneToTelHref(phone)} className="px-4 pt-3 text-sm font-semibold text-ink-2">
              {t.topbar.hotline}
            </a>
          </div>
        )}
      </Container>
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
        aria-pressed={locale === "vi"}
        className={`rounded-full px-[11px] py-[5px] ${locale === "vi" ? "bg-ink text-white" : "text-ink-2"}`}
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={`rounded-full px-[11px] py-[5px] ${locale === "en" ? "bg-ink text-white" : "text-ink-2"}`}
      >
        EN
      </button>
    </div>
  );
}
