export type ProductId =
  | "drum-cleaner"
  | "multi-cleaner"
  | "delicate-wash"
  | "kitchen-spray"
  | "bathroom-spray"
  | "fridge-spray";

export type Product = {
  id: ProductId;
  image: string;
};

export const products: Product[] = [
  {
    id: "drum-cleaner",
    image: "https://2sgroup.vn/wp-content/uploads/2025/04/vn-11134207-7r98o-ltqfjf2hve3173.webp",
  },
  {
    id: "multi-cleaner",
    image: "https://2sgroup.vn/wp-content/uploads/2025/04/A1.jpeg",
  },
  {
    id: "delicate-wash",
    image: "https://2sgroup.vn/wp-content/uploads/2025/04/Anh-01-tui-1024x1024.jpg",
  },
  {
    id: "kitchen-spray",
    image:
      "https://2sgroup.vn/wp-content/uploads/2025/04/z6115050369008_5f2b24a8b31214e974b9d7a7e0dfac23-1024x1024.jpg",
  },
  {
    id: "bathroom-spray",
    image: "https://2sgroup.vn/wp-content/uploads/2025/04/chai-doi-1024x1024.png",
  },
  {
    id: "fridge-spray",
    image:
      "https://2sgroup.vn/wp-content/uploads/2025/04/e795fb7518a148b4984ec155955c1bcbtplv-o3syd03w52-origin-jpeg-1024x1024.jpeg",
  },
];
