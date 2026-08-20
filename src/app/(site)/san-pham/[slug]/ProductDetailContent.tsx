"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { LinkButton } from "@/components/ui/Button";
import type { PublicProduct } from "@/lib/content/products";
import { phoneToTelHref } from "@/lib/phone";

function linesOf(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function ProductDetailContent({ product, phone }: { product: PublicProduct; phone: string }) {
  const { t, locale } = useLanguage();

  const features = linesOf(product.features[locale]);
  const usageLines = linesOf(product.usage[locale]);
  const notesLines = linesOf(product.notes[locale]);

  const specRows = [
    { label: t.productDetail.specBrand, value: product.brand },
    { label: t.productDetail.specType, value: product.productType[locale] },
    { label: t.productDetail.specForm, value: product.form[locale] },
    { label: t.productDetail.specShelfLife, value: product.shelfLife[locale] },
    { label: t.productDetail.specScent, value: product.scent[locale] },
    { label: t.productDetail.specIngredients, value: product.ingredients[locale] },
  ].filter((row) => row.value);

  const tabs = [
    specRows.length > 0 ? { id: "info", label: t.productDetail.tabInfo } : null,
    usageLines.length > 0 ? { id: "usage", label: t.productDetail.tabUsage } : null,
    notesLines.length > 0 ? { id: "notes", label: t.productDetail.tabNotes } : null,
  ].filter((tab): tab is { id: string; label: string } => tab !== null);

  const [activeTab, setActiveTab] = useState(tabs[0]?.id);

  return (
    <>
      <nav className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-ink-2">
        <Link href="/" className="hover:text-accent">
          {t.nav.home}
        </Link>
        {product.tag[locale] && (
          <>
            <span>/</span>
            <span>{product.tag[locale]}</span>
          </>
        )}
        <span>/</span>
        <span className="text-ink">{product.name[locale]}</span>
      </nav>
      <h1 className="mb-10 text-[clamp(28px,3.6vw,44px)] leading-[1.15] font-medium tracking-[-0.02em]">
        {product.name[locale]}
      </h1>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-card bg-wash">
          <Image
            src={product.image}
            alt={product.name[locale]}
            width={640}
            height={640}
            className="h-full w-full object-contain mix-blend-multiply"
          />
        </div>

        <div className="flex flex-col gap-5">
          <h2 className="text-2xl font-semibold">{product.name[locale]}</h2>
          <p className="text-[15.5px] leading-[1.8] text-ink-2">{product.descLong[locale]}</p>

          {features.length > 0 && (
            <div className="flex flex-col gap-2.5 border-t border-line pt-5">
              <h3 className="text-sm font-semibold">{t.productDetail.featuresTitle}</h3>
              <ul className="flex flex-col gap-1.5">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-[14.5px] text-ink-2">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.volume && (
            <p className="text-[14.5px]">
              <span className="font-semibold">{t.productDetail.volumeLabel}:</span> {product.volume}
            </p>
          )}

          <div className="flex items-center gap-2 border-t border-line pt-5 text-[15px]">
            <span className="text-ink-2">{t.productDetail.priceLabel}:</span>
            <span className="font-semibold text-accent">
              {product.priceLabel[locale] || t.productDetail.priceContact}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <LinkButton href="/lien-he" variant="accent">
              {t.productDetail.ctaQuote}
            </LinkButton>
            <LinkButton href={phoneToTelHref(phone)} variant="light">
              {t.productDetail.ctaCall}
            </LinkButton>
          </div>
        </div>
      </div>

      {tabs.length > 0 && (
        <div className="mt-16">
          <div className="flex flex-wrap gap-1 border-b border-line">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`cursor-pointer px-5 py-3 text-[13px] font-semibold tracking-[0.06em] uppercase transition-colors duration-300 ease-soft ${
                  activeTab === tab.id ? "border-b-2 border-accent text-accent" : "text-ink-2 hover:text-ink"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="rounded-b-card border border-t-0 border-line p-6">
            {activeTab === "info" && (
              <table className="w-full border-collapse text-[14.5px]">
                <tbody>
                  {specRows.map((row, i) => (
                    <tr key={row.label} className={i % 2 === 0 ? "bg-wash" : ""}>
                      <td className="w-1/3 px-4 py-3 font-semibold">{row.label}</td>
                      <td className="px-4 py-3 text-ink-2">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {activeTab === "usage" && (
              <div className="flex flex-col gap-2.5 text-[14.5px] leading-[1.75] text-ink-2">
                {usageLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            )}
            {activeTab === "notes" && (
              <div className="flex flex-col gap-2.5 text-[14.5px] leading-[1.75] text-ink-2">
                {notesLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
