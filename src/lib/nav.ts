import type { Dictionary } from "@/lib/i18n/types";

export type NavKey = keyof Pick<Dictionary["nav"], "home" | "products" | "about" | "partners" | "news" | "contact">;

export const NAV_ITEMS: { key: NavKey; href: string }[] = [
  { key: "home", href: "/" },
  { key: "products", href: "/san-pham" },
  { key: "about", href: "/gioi-thieu" },
  { key: "partners", href: "/doi-tac-dai-ly" },
  { key: "news", href: "/tin-tuc" },
  { key: "contact", href: "/lien-he" },
];
