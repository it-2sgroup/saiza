import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ProductsPageContent } from "./ProductsPageContent";
import { getPublicProducts } from "@/lib/content/products";

export const metadata: Metadata = {
  title: "Sản phẩm | SAIZA",
};

export default async function ProductsPage() {
  const products = await getPublicProducts();

  return (
    <Container as="section" className="pt-32 pb-24">
      <ProductsPageContent products={products} />
    </Container>
  );
}
