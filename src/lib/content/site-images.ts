import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { HERO_SLIDES, type HeroSlide } from "@/lib/data/hero";
import { kolList, type Kol } from "@/lib/data/kol";
import { galleryImages } from "@/lib/data/gallery";

export const DEFAULT_LOGO_DARK = "/images/brand/saiza-logo-navy.png";
export const DEFAULT_LOGO_LIGHT = "/images/brand/saiza-logo-white.png";
const DEFAULT_WHY_US_IMAGE = "/images/why-choose-lab.png";
const DEFAULT_ABOUT_HERO_IMAGE = "https://2sgroup.vn/wp-content/uploads/2025/04/102581-1024x682.jpg";
const DEFAULT_PARTNERS_CTA_IMAGE =
  "https://2sgroup.vn/wp-content/uploads/2025/04/11f57cbc-5a38-44e2-9040-47f02ba311b9-20240705-ADP-Bosch-17-1024x576.webp";

// Fixed named slots — an admin can only ever replace the picture here, never
// add/remove a slot. Open-ended lists (hero banners, KOL photos, about-page
// gallery) live in `site_image_items` instead — see getHeroSlides()/
// getKolList()/getGalleryImages() below.
export type SiteImageDef = {
  key: string;
  group: string;
  label: string;
  defaultUrl: string;
};

export const SITE_IMAGE_CATALOG: SiteImageDef[] = [
  { key: "logo.dark", group: "Thương hiệu", label: "Logo (nền sáng)", defaultUrl: DEFAULT_LOGO_DARK },
  { key: "logo.light", group: "Thương hiệu", label: "Logo (nền tối)", defaultUrl: DEFAULT_LOGO_LIGHT },
  { key: "why_us.image", group: "Trang chủ — Vì sao chọn SAIZA", label: "Ảnh minh hoạ", defaultUrl: DEFAULT_WHY_US_IMAGE },
  { key: "about.hero_image", group: "Giới thiệu", label: "Ảnh minh hoạ đầu trang", defaultUrl: DEFAULT_ABOUT_HERO_IMAGE },
  {
    key: "partners.cta_image",
    group: "Đối tác & Đại lý",
    label: "Ảnh băng kêu gọi liên hệ",
    defaultUrl: DEFAULT_PARTNERS_CTA_IMAGE,
  },
];

// Deduped per-request via React's cache() — every getX() below reads this
// once even though a single page render calls several of them.
export const getSiteImageOverrides = cache(async (): Promise<Record<string, string>> => {
  const supabase = await createClient();
  const { data } = await supabase.from("site_images").select("key, url");
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.url;
  return map;
});

function resolve(overrides: Record<string, string>, key: string, fallback: string) {
  return overrides[key] || fallback;
}

export async function getLogoUrls() {
  const overrides = await getSiteImageOverrides();
  return {
    dark: resolve(overrides, "logo.dark", DEFAULT_LOGO_DARK),
    light: resolve(overrides, "logo.light", DEFAULT_LOGO_LIGHT),
  };
}

export async function getWhyUsImage(): Promise<string> {
  const overrides = await getSiteImageOverrides();
  return resolve(overrides, "why_us.image", DEFAULT_WHY_US_IMAGE);
}

export async function getAboutHeroImage(): Promise<string> {
  const overrides = await getSiteImageOverrides();
  return resolve(overrides, "about.hero_image", DEFAULT_ABOUT_HERO_IMAGE);
}

export async function getPartnersCtaImage(): Promise<string> {
  const overrides = await getSiteImageOverrides();
  return resolve(overrides, "partners.cta_image", DEFAULT_PARTNERS_CTA_IMAGE);
}

// --- Open-ended lists: admin can add/remove entries, not just replace one ---

type SiteImageItemRow = { id: string; url: string; label: string | null; bright: boolean };

const getSiteImageItems = cache(async (listKey: string): Promise<SiteImageItemRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_image_items")
    .select("id, url, label, bright")
    .eq("list_key", listKey)
    .order("sort_order", { ascending: true });
  return data ?? [];
});

export async function getHeroSlides(): Promise<HeroSlide[]> {
  const items = await getSiteImageItems("hero");
  if (items.length === 0) return HERO_SLIDES;
  return items.map((item) => ({ src: item.url, bright: item.bright }));
}

export async function getKolList(): Promise<Kol[]> {
  const items = await getSiteImageItems("kol");
  if (items.length === 0) return kolList;
  return items.map((item) => ({ name: item.label ?? "", image: item.url }));
}

export async function getGalleryImages(): Promise<string[]> {
  const items = await getSiteImageItems("gallery");
  if (items.length === 0) return galleryImages;
  return items.map((item) => item.url);
}
