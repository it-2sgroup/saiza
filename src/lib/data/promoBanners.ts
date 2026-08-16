export type PromoBanner = {
  id: string;
  image: string;
  alt: string;
  href: string;
};

export const promoBanners: PromoBanner[] = [
  {
    id: "saiza-clean",
    image: "/images/banners/saiza-clean-promo.jpg",
    alt: "Tẩy đa năng SAIZA Clean 2X More Power — tiêu diệt 99,99% vi khuẩn",
    href: "/san-pham",
  },
  {
    id: "silky-clean",
    image: "/images/banners/silky-clean-promo.jpg",
    alt: "Nước giặt đồ lót SAIZA Silky Clean — công nghệ enzyme sinh học",
    href: "/san-pham",
  },
];
