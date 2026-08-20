import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ConfigField = {
  key: string;
  group: string;
  label: string;
  placeholder?: string;
};

export const DEFAULT_SITE_CONFIG: Record<string, string> = {
  "contact.phone": "0946 010 818",
  "contact.email": "2sgrouprecruitment@gmail.com",
  "contact.office1_address": "131 Đường số 1A, KDC Nam Hùng Vương, P. An Lạc, Q. Bình Tân, TP.HCM",
  "contact.office2_address": "Số 4, Đường Mỹ Đa Tây 9, P. Ngũ Hành Sơn, TP. Đà Nẵng",
  "contact.office1_map_src": "https://www.google.com/maps?q=10.7482316,106.6205113&output=embed",
  "contact.office2_map_src": "https://www.google.com/maps?q=16.0353916,108.2436164&output=embed",
  "social.facebook_url": "#",
  "social.zalo_url": "https://zalo.me/2370206612544279169",
  "social.messenger_url": "https://m.me/2sgroup",
  "social.tiktok_url": "https://www.tiktok.com/@saizavn",
  "careers.apply_form_url": "https://2sgroupvn.sg.larksuite.com/share/base/form/shrlg08JW1HYgZPly5PXA05WRC6",
  "home.video_ids": "SDRusknEKEo,BiLv4eZFBGA,1f-PmFE3zeg",
};

export const SITE_CONFIG_CATALOG: ConfigField[] = [
  { key: "contact.phone", group: "Liên hệ", label: "Số điện thoại" },
  { key: "contact.email", group: "Liên hệ", label: "Email" },
  { key: "contact.office1_address", group: "Liên hệ", label: "Địa chỉ văn phòng TP.HCM" },
  { key: "contact.office2_address", group: "Liên hệ", label: "Địa chỉ văn phòng Đà Nẵng" },
  {
    key: "contact.office1_map_src",
    group: "Liên hệ",
    label: "Link nhúng Google Maps — văn phòng TP.HCM",
    placeholder: "https://www.google.com/maps?q=...&output=embed",
  },
  {
    key: "contact.office2_map_src",
    group: "Liên hệ",
    label: "Link nhúng Google Maps — văn phòng Đà Nẵng",
    placeholder: "https://www.google.com/maps?q=...&output=embed",
  },
  { key: "social.facebook_url", group: "Mạng xã hội", label: "Link Facebook" },
  { key: "social.zalo_url", group: "Mạng xã hội", label: "Link Zalo" },
  { key: "social.messenger_url", group: "Mạng xã hội", label: "Link Messenger" },
  { key: "social.tiktok_url", group: "Mạng xã hội", label: "Link TikTok" },
  { key: "careers.apply_form_url", group: "Tuyển dụng", label: "Link form ứng tuyển (Lark)" },
  {
    key: "home.video_ids",
    group: "Trang chủ",
    label: "Mã video YouTube (cách nhau bằng dấu phẩy)",
    placeholder: "SDRusknEKEo,BiLv4eZFBGA,1f-PmFE3zeg",
  },
];

export type SiteConfig = {
  phone: string;
  email: string;
  office1Address: string;
  office2Address: string;
  office1MapSrc: string;
  office2MapSrc: string;
  facebookUrl: string;
  zaloUrl: string;
  messengerUrl: string;
  tiktokUrl: string;
  applyFormUrl: string;
  videoIds: string[];
};

export type OfficeConfig = { id: "hcm" | "danang"; address: string; mapSrc: string };

export const getSiteConfigOverrides = cache(async (): Promise<Record<string, string>> => {
  const supabase = await createClient();
  const { data } = await supabase.from("site_config").select("key, value");
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
});

export async function getSiteConfig(): Promise<SiteConfig> {
  const overrides = await getSiteConfigOverrides();
  const val = (key: string) => overrides[key] || DEFAULT_SITE_CONFIG[key] || "";

  return {
    phone: val("contact.phone"),
    email: val("contact.email"),
    office1Address: val("contact.office1_address"),
    office2Address: val("contact.office2_address"),
    office1MapSrc: val("contact.office1_map_src"),
    office2MapSrc: val("contact.office2_map_src"),
    facebookUrl: val("social.facebook_url"),
    zaloUrl: val("social.zalo_url"),
    messengerUrl: val("social.messenger_url"),
    tiktokUrl: val("social.tiktok_url"),
    applyFormUrl: val("careers.apply_form_url"),
    videoIds: val("home.video_ids")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

export async function getOfficesConfig(): Promise<OfficeConfig[]> {
  const config = await getSiteConfig();
  return [
    { id: "hcm", address: config.office1Address, mapSrc: config.office1MapSrc },
    { id: "danang", address: config.office2Address, mapSrc: config.office2MapSrc },
  ];
}


// Admin-only: reads every override row directly via the service-role client
// (bypasses RLS, used from the admin dashboard where the caller's role has
// already been checked).
export async function getAllSiteConfigForAdmin(): Promise<Record<string, string>> {
  const admin = createAdminClient();
  const { data } = await admin.from("site_config").select("key, value");
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
}
