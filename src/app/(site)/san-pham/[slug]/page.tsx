import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { getPublicProductBySlug } from "@/lib/content/products";
import { getSiteConfig } from "@/lib/content/site-config";
import { ProductDetailContent } from "./ProductDetailContent";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  return { title: product ? `${product.name.vi} | SAIZA` : "Sản phẩm | SAIZA" };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, config] = await Promise.all([getPublicProductBySlug(slug), getSiteConfig()]);
  if (!product) notFound();

  return (
    <Container as="section" className="pt-32 pb-24">
      <ProductDetailContent product={product} phone={config.phone} />
    </Container>
  );
}
