import type { Metadata } from "next";
import { AboutPageContent } from "./AboutPageContent";
import { getAboutHeroImage, getGalleryImages } from "@/lib/content/site-images";

export const metadata: Metadata = {
  title: "Về SAIZA | SAIZA",
};

export default async function AboutPage() {
  const [heroImage, galleryImages] = await Promise.all([getAboutHeroImage(), getGalleryImages()]);
  return <AboutPageContent heroImage={heroImage} galleryImages={galleryImages} />;
}
