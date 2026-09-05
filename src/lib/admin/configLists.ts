import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveConfigLabel, type ConfigOption } from "./configListHelpers";

export type { ConfigOption };
export { resolveConfigLabel };

export type ConfigListKey = "department" | "org_code" | "doc_type";

export type ConfigLists = {
  departments: ConfigOption[];
  orgCodes: ConfigOption[];
  docTypes: ConfigOption[];
};

// Fallback used only if the table is unreachable (migration not applied
// yet) — same defensive pattern as the rest of this app's Lark caches, so a
// not-yet-migrated deployment degrades to the old hardcoded behavior instead
// of breaking every form that used to read DEPARTMENTS/ORG_CODES/DOC_TYPES.
const FALLBACK: ConfigLists = {
  departments: [
    { code: "BGD", label: "Ban Giám đốc", note: "Tài liệu chiến lược, báo cáo cấp cao" },
    { code: "KT", label: "Tài chính – Kế toán", note: null },
    { code: "HCNS", label: "Hành chính – Nhân sự", note: null },
    { code: "MKT", label: "Marketing", note: null },
    { code: "MD", label: "Media (video và live)", note: null },
    { code: "IT", label: "Công nghệ thông tin", note: null },
    { code: "SP", label: "Sản phẩm", note: null },
    { code: "KD", label: "Kinh doanh", note: null },
    { code: "TT", label: "Kênh TikTok", note: "Thuộc Phòng Kinh doanh" },
    { code: "SHP", label: "Kênh Shopee", note: "Thuộc Phòng Kinh doanh" },
    { code: "FB", label: "Kênh Facebook", note: "Thuộc Phòng Kinh doanh" },
    { code: "BK", label: "Booking", note: "Thuộc kênh TikTok" },
    { code: "VH", label: "Vận hành", note: null },
    { code: "CSKH", label: "Chăm sóc khách hàng", note: null },
    { code: "TM", label: "Thu mua", note: null },
    { code: "ALL", label: "Toàn công ty", note: "Tài liệu dùng chung cho mọi phòng ban" },
  ],
  orgCodes: [
    { code: "SISMO", label: "SISMO", note: null },
    { code: "SAIZA", label: "SAIZA", note: null },
    { code: "2S", label: "2S", note: null },
  ],
  docTypes: [
    { code: "Báo Cáo", label: "Báo cáo", note: "Báo cáo định kỳ, báo cáo dự án" },
    { code: "Kế Hoạch", label: "Kế hoạch", note: "Kế hoạch, đề xuất" },
    { code: "Hợp Đồng", label: "Hợp đồng", note: "Hợp đồng, phụ lục hợp đồng" },
    { code: "Biên Bản", label: "Biên bản", note: "Biên bản họp / nghiệm thu" },
    { code: "Tài Liệu", label: "Tài liệu", note: "Tài liệu kỹ thuật, hướng dẫn" },
    { code: "Template", label: "Template", note: "Biểu mẫu, mẫu dùng lại" },
    { code: "Chính Sách", label: "Chính sách", note: "Chính sách nội bộ" },
  ],
};

const LIST_KEY_TO_FIELD: Record<ConfigListKey, keyof ConfigLists> = {
  department: "departments",
  org_code: "orgCodes",
  doc_type: "docTypes",
};

/** Single read for every admin-editable dropdown list (departments, org codes, doc types). */
export async function getConfigLists(): Promise<ConfigLists> {
  const admin = createAdminClient();
  const { data, error } = await admin.from("config_lists").select("list_key, code, label, note").order("sort_order");
  if (error || !data) return FALLBACK;

  const result: ConfigLists = { departments: [], orgCodes: [], docTypes: [] };
  for (const row of data) {
    const field = LIST_KEY_TO_FIELD[row.list_key as ConfigListKey];
    if (field) result[field].push({ code: row.code, label: row.label, note: row.note });
  }
  return result;
}

export type ConfigListMutationState = { error: string | null; success?: boolean };

async function nextSortOrder(admin: ReturnType<typeof createAdminClient>, listKey: ConfigListKey): Promise<number> {
  const { data } = await admin
    .from("config_lists")
    .select("sort_order")
    .eq("list_key", listKey)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? -1) + 1;
}

export async function addConfigOption(
  listKey: ConfigListKey,
  code: string,
  label: string,
  note: string | null,
): Promise<ConfigListMutationState> {
  const admin = createAdminClient();
  const sortOrder = await nextSortOrder(admin, listKey);
  const { error } = await admin.from("config_lists").insert({ list_key: listKey, code, label, note, sort_order: sortOrder });
  if (error) {
    // Postgres unique_violation — the friendliest, most likely cause here.
    if (error.code === "23505") return { error: "Mã này đã tồn tại." };
    return { error: "Không thêm được. Vui lòng thử lại." };
  }
  return { error: null, success: true };
}

export async function renameConfigOption(
  listKey: ConfigListKey,
  code: string,
  label: string,
  note: string | null,
): Promise<ConfigListMutationState> {
  const admin = createAdminClient();
  const { error } = await admin.from("config_lists").update({ label, note }).eq("list_key", listKey).eq("code", code);
  if (error) return { error: "Không lưu được. Vui lòng thử lại." };
  return { error: null, success: true };
}

// Deliberately does NOT touch profiles.department / existing Lark file names
// that already reference this code — same reasoning as Lark's own defaults:
// removing an option only stops it being OFFERED going forward.
// resolveConfigLabel already falls back to showing the raw code for any
// already-assigned value that no longer matches a live option, so nothing
// breaks for past records; it just stops being a pickable choice.
export async function removeConfigOption(listKey: ConfigListKey, code: string): Promise<ConfigListMutationState> {
  const admin = createAdminClient();
  const { error } = await admin.from("config_lists").delete().eq("list_key", listKey).eq("code", code);
  if (error) return { error: "Không xoá được. Vui lòng thử lại." };
  return { error: null, success: true };
}
