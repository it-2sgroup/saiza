"use client";

import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Product } from "@/lib/data/products";

export function ProductGridCard({ product }: { product: Product }) {
  const { t } = useLanguage();
  const copy = t.products[product.id];

  return (
    <article className="flex flex-col overflow-hidden rounded-card border border-line bg-card">
      <div className="flex aspect-[4/3] items-center justify-center bg-wash p-6.5">
        <Image
          src={product.image}
          alt={copy.name}
          width={320}
          height={240}
          className="h-full w-full object-contain mix-blend-multiply"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="text-lg leading-[1.35] font-semibold">{copy.name}</h3>
        <p className="flex-1 text-[14.5px] leading-[1.7] text-ink-2">{copy.descLong}</p>
        <div className="mt-1.5 flex flex-wrap gap-2.5">
          <span className="cursor-pointer rounded-full bg-accent px-4.5 py-2.5 text-[13.5px] font-semibold text-white hover:bg-ink">
            {t.productsPage.buyShopee}
          </span>
          <span className="cursor-pointer rounded-full border border-line px-4.5 py-2.5 text-[13.5px] font-semibold hover:border-ink">
            {t.productsPage.buyTiktok}
          </span>
        </div>
      </div>
    </article>
  );
}
