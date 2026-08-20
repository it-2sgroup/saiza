import { Hero } from "@/components/home/Hero";
import { StatsBar } from "@/components/home/StatsBar";
import { TrustStrip } from "@/components/home/TrustStrip";
import { ProductVideos } from "@/components/home/ProductVideos";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { WhyUs } from "@/components/home/WhyUs";
import { KolSection } from "@/components/home/KolSection";
import { NewsPreview } from "@/components/home/NewsPreview";
import { OfficeLocationsSection } from "@/components/home/OfficeLocationsSection";
import { WaveDivider } from "@/components/ui/WaveDivider";
import { createClient } from "@/lib/supabase/server";
import type { NewsPost } from "@/lib/admin/types";
import { getHeroSlides, getWhyUsImage, getKolList } from "@/lib/content/site-images";
import { getPublicProducts } from "@/lib/content/products";
import { getOfficesConfig, getSiteConfig } from "@/lib/content/site-config";

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data }, heroSlides, whyUsImage, kolList, products, offices, config] = await Promise.all([
    supabase
      .from("news_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(4),
    getHeroSlides(),
    getWhyUsImage(),
    getKolList(),
    getPublicProducts(),
    getOfficesConfig(),
    getSiteConfig(),
  ]);

  return (
    <>
      <Hero slides={heroSlides} />
      <StatsBar />
      <WaveDivider topClassName="bg-ink" fill="var(--color-card)" />
      <TrustStrip />
      <ProductVideos videoIds={config.videoIds} />
      <ProductCarousel products={products} />
      <WhyUs imageUrl={whyUsImage} />
      <WaveDivider topClassName="bg-ink" fill="var(--color-paper)" />
      <KolSection kolList={kolList} />
      <NewsPreview posts={(data ?? []) as NewsPost[]} />
      <OfficeLocationsSection offices={offices} />
    </>
  );
}
