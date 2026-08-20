"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductGridCard } from "@/components/products/ProductGridCard";
import type { PublicProduct } from "@/lib/content/products";

export function ProductsPageContent({ products }: { products: PublicProduct[] }) {
  const { t } = useLanguage();

  return (
    <>
      <SectionHeading
        as="h1"
        eyebrow={t.productsPage.eyebrow}
        title={t.productsPage.title}
        subtitle={t.productsPage.subtitle}
        className="mb-12 max-w-[680px]"
      />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
        {products.map((product) => (
          <ProductGridCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
