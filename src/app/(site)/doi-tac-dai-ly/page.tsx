import type { Metadata } from "next";
import { PartnersPageContent } from "./PartnersPageContent";
import { getPartnersCtaImage } from "@/lib/content/site-images";

export const metadata: Metadata = {
  title: "Đối tác & Đại lý | SAIZA",
};

export default async function PartnersPage() {
  const ctaImage = await getPartnersCtaImage();
  return <PartnersPageContent ctaImage={ctaImage} />;
}
