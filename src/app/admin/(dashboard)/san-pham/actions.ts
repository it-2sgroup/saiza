"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canPublish, canDelete } from "@/lib/admin/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAuditLog } from "@/lib/admin/audit";
import { uniqueSlug } from "@/lib/admin/slug";

export type ProductFormState = { error: string | null };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function readFields(formData: FormData) {
  const get = (name: string) => String(formData.get(name) ?? "").trim();
  return {
    brand: get("brand") || "SAIZA",
    tagVi: get("tag_vi"),
    tagEn: get("tag_en"),
    nameVi: get("name_vi"),
    nameEn: get("name_en"),
    descShortVi: get("desc_short_vi"),
    descShortEn: get("desc_short_en"),
    descLongVi: get("desc_long_vi"),
    descLongEn: get("desc_long_en"),
    featuresVi: get("features_vi"),
    featuresEn: get("features_en"),
    volume: get("volume"),
    priceLabelVi: get("price_label_vi"),
    priceLabelEn: get("price_label_en"),
    productTypeVi: get("product_type_vi"),
    productTypeEn: get("product_type_en"),
    formVi: get("form_vi"),
    formEn: get("form_en"),
    shelfLifeVi: get("shelf_life_vi"),
    shelfLifeEn: get("shelf_life_en"),
    scentVi: get("scent_vi"),
    scentEn: get("scent_en"),
    ingredientsVi: get("ingredients_vi"),
    ingredientsEn: get("ingredients_en"),
    usageVi: get("usage_vi"),
    usageEn: get("usage_en"),
    notesVi: get("notes_vi"),
    notesEn: get("notes_en"),
  };
}

function toRow(fields: ReturnType<typeof readFields>) {
  return {
    brand: fields.brand,
    tag_vi: fields.tagVi,
    tag_en: fields.tagEn,
    name_vi: fields.nameVi,
    name_en: fields.nameEn,
    desc_short_vi: fields.descShortVi,
    desc_short_en: fields.descShortEn,
    desc_long_vi: fields.descLongVi,
    desc_long_en: fields.descLongEn,
    features_vi: fields.featuresVi || null,
    features_en: fields.featuresEn || null,
    volume: fields.volume || null,
    price_label_vi: fields.priceLabelVi || null,
    price_label_en: fields.priceLabelEn || null,
    product_type_vi: fields.productTypeVi || null,
    product_type_en: fields.productTypeEn || null,
    form_vi: fields.formVi || null,
    form_en: fields.formEn || null,
    shelf_life_vi: fields.shelfLifeVi || null,
    shelf_life_en: fields.shelfLifeEn || null,
    scent_vi: fields.scentVi || null,
    scent_en: fields.scentEn || null,
    ingredients_vi: fields.ingredientsVi || null,
    ingredients_en: fields.ingredientsEn || null,
    usage_vi: fields.usageVi || null,
    usage_en: fields.usageEn || null,
    notes_vi: fields.notesVi || null,
    notes_en: fields.notesEn || null,
  };
}

type UploadResult = { error: string } | { url: string };

async function uploadProductImage(
  admin: ReturnType<typeof createAdminClient>,
  id: string,
  file: File,
): Promise<UploadResult> {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return { error: "Chỉ nhận ảnh JPEG, PNG hoặc WEBP." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Ảnh tối đa 5MB." };

  const path = `products/${id}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from("site-images")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { error: `Không tải lên được: ${uploadError.message}` };

  const { data } = admin.storage.from("site-images").getPublicUrl(path);
  return { url: `${data.publicUrl}?t=${Date.now()}` };
}

export async function createProduct(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const profile = await getCurrentProfile();
  if (!profile || !canPublish(profile.role)) return { error: "Bạn không có quyền thực hiện." };

  const fields = readFields(formData);
  if (!fields.nameVi || !fields.nameEn) return { error: "Cần nhập tên sản phẩm cho cả hai ngôn ngữ." };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Chọn một ảnh sản phẩm." };

  const admin = createAdminClient();
  const id = crypto.randomUUID();

  const uploadResult = await uploadProductImage(admin, id, file);
  if ("error" in uploadResult) return { error: uploadResult.error };

  const { count } = await admin.from("products").select("id", { count: "exact", head: true });

  const { error } = await admin.from("products").insert({
    id,
    slug: uniqueSlug(fields.nameVi),
    image_url: uploadResult.url,
    sort_order: (count ?? 0) + 1,
    updated_by: profile.id,
    ...toRow(fields),
  });
  if (error) return { error: `Không lưu được: ${error.message}` };

  await recordAuditLog({ actorId: profile.id, action: "product_created", targetTable: "products", targetId: id });

  revalidatePath("/admin/san-pham");
  revalidatePath("/", "layout");
  redirect("/admin/san-pham");
}

export async function updateProduct(
  id: string,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const profile = await getCurrentProfile();
  if (!profile || !canPublish(profile.role)) return { error: "Bạn không có quyền thực hiện." };

  const fields = readFields(formData);
  if (!fields.nameVi || !fields.nameEn) return { error: "Cần nhập tên sản phẩm cho cả hai ngôn ngữ." };

  const admin = createAdminClient();
  const update: Record<string, unknown> = {
    ...toRow(fields),
    updated_by: profile.id,
    updated_at: new Date().toISOString(),
  };

  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const uploadResult = await uploadProductImage(admin, id, file);
    if ("error" in uploadResult) return { error: uploadResult.error };
    update.image_url = uploadResult.url;
  }

  const { error } = await admin.from("products").update(update).eq("id", id);
  if (error) return { error: `Không lưu được: ${error.message}` };

  await recordAuditLog({ actorId: profile.id, action: "product_updated", targetTable: "products", targetId: id });

  revalidatePath("/admin/san-pham");
  revalidatePath("/", "layout");
  redirect("/admin/san-pham");
}

export async function deleteProduct(id: string) {
  const profile = await getCurrentProfile();
  if (!profile || !canDelete(profile.role)) return;

  const admin = createAdminClient();
  await admin.from("products").delete().eq("id", id);

  await recordAuditLog({ actorId: profile.id, action: "product_deleted", targetTable: "products", targetId: id });

  revalidatePath("/admin/san-pham");
  revalidatePath("/", "layout");
}
