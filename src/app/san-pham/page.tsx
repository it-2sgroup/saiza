import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ProductsPageContent } from "./ProductsPageContent";

export const metadata: Metadata = {
  title: "Sản phẩm | 2S Group",
};

export default function ProductsPage() {
  return (
    <Container as="section" className="pt-18 pb-24">
      <ProductsPageContent />
    </Container>
  );
}
