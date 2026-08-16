import { Hero } from "@/components/home/Hero";
import { StatsBar } from "@/components/home/StatsBar";
import { TrustStrip } from "@/components/home/TrustStrip";
import { ProductVideos } from "@/components/home/ProductVideos";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { WhyUs } from "@/components/home/WhyUs";
import { KolSection } from "@/components/home/KolSection";
import { NewsPreview } from "@/components/home/NewsPreview";
import { OfficeLocationsSection } from "@/components/home/OfficeLocationsSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsBar />
      <TrustStrip />
      <ProductVideos />
      <ProductCarousel />
      <WhyUs />
      <KolSection />
      <NewsPreview />
      <OfficeLocationsSection />
    </>
  );
}
