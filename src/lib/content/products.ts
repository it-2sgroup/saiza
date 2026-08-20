import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type LocalizedText = { vi: string; en: string };

export type PublicProduct = {
  id: string;
  slug: string;
  image: string;
  brand: string;
  tag: LocalizedText;
  name: LocalizedText;
  descShort: LocalizedText;
  descLong: LocalizedText;
  features: LocalizedText;
  volume: string | null;
  priceLabel: LocalizedText;
  productType: LocalizedText;
  form: LocalizedText;
  shelfLife: LocalizedText;
  scent: LocalizedText;
  ingredients: LocalizedText;
  usage: LocalizedText;
  notes: LocalizedText;
};

type ProductRow = {
  id: string;
  slug: string;
  image_url: string;
  brand: string;
  tag_vi: string;
  tag_en: string;
  name_vi: string;
  name_en: string;
  desc_short_vi: string;
  desc_short_en: string;
  desc_long_vi: string;
  desc_long_en: string;
  features_vi: string | null;
  features_en: string | null;
  volume: string | null;
  price_label_vi: string | null;
  price_label_en: string | null;
  product_type_vi: string | null;
  product_type_en: string | null;
  form_vi: string | null;
  form_en: string | null;
  shelf_life_vi: string | null;
  shelf_life_en: string | null;
  scent_vi: string | null;
  scent_en: string | null;
  ingredients_vi: string | null;
  ingredients_en: string | null;
  usage_vi: string | null;
  usage_en: string | null;
  notes_vi: string | null;
  notes_en: string | null;
};

function toPublicProduct(row: ProductRow): PublicProduct {
  return {
    id: row.id,
    slug: row.slug,
    image: row.image_url,
    brand: row.brand,
    tag: { vi: row.tag_vi, en: row.tag_en },
    name: { vi: row.name_vi, en: row.name_en },
    descShort: { vi: row.desc_short_vi, en: row.desc_short_en },
    descLong: { vi: row.desc_long_vi, en: row.desc_long_en },
    features: { vi: row.features_vi ?? "", en: row.features_en ?? "" },
    volume: row.volume,
    priceLabel: { vi: row.price_label_vi ?? "", en: row.price_label_en ?? "" },
    productType: { vi: row.product_type_vi ?? "", en: row.product_type_en ?? "" },
    form: { vi: row.form_vi ?? "", en: row.form_en ?? "" },
    shelfLife: { vi: row.shelf_life_vi ?? "", en: row.shelf_life_en ?? "" },
    scent: { vi: row.scent_vi ?? "", en: row.scent_en ?? "" },
    ingredients: { vi: row.ingredients_vi ?? "", en: row.ingredients_en ?? "" },
    usage: { vi: row.usage_vi ?? "", en: row.usage_en ?? "" },
    notes: { vi: row.notes_vi ?? "", en: row.notes_en ?? "" },
  };
}

export const getPublicProducts = cache(async (): Promise<PublicProduct[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").order("sort_order", { ascending: true });
  return (data ?? []).map((row) => toPublicProduct(row as ProductRow));
});

export const getPublicProductBySlug = cache(async (slug: string): Promise<PublicProduct | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").eq("slug", slug).single();
  return data ? toPublicProduct(data as ProductRow) : null;
});
