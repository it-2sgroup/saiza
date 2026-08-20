"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { PublicProduct } from "@/lib/content/products";

export function ProductGridCard({ product }: { product: PublicProduct }) {
  const { t, locale } = useLanguage();

  return (
    <article className="flex flex-col overflow-hidden rounded-card border border-line bg-card shadow-[0_10px_26px_rgba(22,33,62,0.06)] transition-all duration-400 ease-soft hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(22,33,62,0.14)]">
      <div className="flex aspect-[4/3] items-center justify-center bg-wash p-6.5">
        <Image
          src={product.image}
          alt={product.name[locale]}
          width={320}
          height={240}
          className="h-full w-full object-contain mix-blend-multiply"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <Link href={`/san-pham/${product.slug}`} className="hover:text-accent">
          <h3 className="text-lg leading-[1.35] font-semibold">{product.name[locale]}</h3>
        </Link>
        <p className="flex-1 text-[14.5px] leading-[1.7] text-ink-2">{product.descLong[locale]}</p>
        <Link href={`/san-pham/${product.slug}`} className="text-sm font-semibold">
          {t.home.catalog.viewDetails}
        </Link>
        <div className="mt-1.5 flex flex-wrap gap-2.5">
          <button
            type="button"
            className="cursor-pointer rounded-full bg-accent px-4.5 py-2.5 text-[13.5px] font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink"
          >
            {t.productsPage.buyShopee}
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-full border border-line px-4.5 py-2.5 text-[13.5px] font-semibold transition-colors duration-300 ease-soft hover:border-ink"
          >
            {t.productsPage.buyTiktok}
          </button>
        </div>
      </div>
    </article>
  );
}
