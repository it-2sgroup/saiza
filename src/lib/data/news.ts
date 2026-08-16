export type NewsId = "strategy" | "positioning" | "experience" | "ecommerce";

export type NewsItem = {
  id: NewsId;
  image: string;
  href: string;
};

export const newsItems: NewsItem[] = [
  {
    id: "strategy",
    image: "https://2sgroup.vn/wp-content/uploads/2025/04/2149151159-1.jpg",
    href: "https://2sgroup.vn/tin-tuc/chien-luoc-phat-trien-cua-2s/",
  },
  {
    id: "positioning",
    image: "https://2sgroup.vn/wp-content/uploads/2025/04/104046-1.jpg",
    href: "https://2sgroup.vn/tin-tuc/khang-dinh-vi-the-tien-phong-trong-nganh-tay-rua/",
  },
  {
    id: "experience",
    image: "https://2sgroup.vn/wp-content/uploads/2025/04/96074.jpg",
    href: "https://2sgroup.vn/tin-tuc/mo-rong-thi-truong-va-nang-cao-trai-nghiem-khach-hang/",
  },
  {
    id: "ecommerce",
    image: "https://2sgroup.vn/wp-content/uploads/2025/04/1384.jpg",
    href: "https://2sgroup.vn/tin-tuc/295/",
  },
];
