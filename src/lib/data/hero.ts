export type HeroSlide = {
  src: string;
  bright: boolean;
};

export const HERO_SLIDES: HeroSlide[] = [
  { src: "/images/banner-kitchen-bathroom.png", bright: false },
  { src: "/images/banner-product-closeup.png", bright: false },
  { src: "/images/banner-warehouse.png", bright: false },
  // These two are much brighter campaign renders, so they get an extra
  // uniform scrim below so the headline stays readable on top of them.
  { src: "/images/banner-saiza-clean-promo.png", bright: true },
  { src: "/images/banner-silky-clean-promo.png", bright: true },
];
