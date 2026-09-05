import { getCurrentProfile } from "@/lib/supabase/profile";
import { canPublish } from "@/lib/admin/permissions";
import { flattenDictionary, getAllTextOverridesForAdmin } from "@/lib/content/site-text";
import { TextGroupsList, type TextGroup } from "./TextGroupsList";

const GROUP_LABELS: Record<string, string> = {
  common: "Chung",
  meta: "Thẻ meta (SEO)",
  topbar: "Thanh trên cùng",
  nav: "Menu điều hướng",
  "home.hero": "Trang chủ — Banner đầu trang",
  "home.stats": "Trang chủ — Số liệu",
  "home.trust": "Trang chủ — Cam kết",
  "home.videos": "Trang chủ — Video sản phẩm",
  "home.catalog": "Trang chủ — Danh mục sản phẩm",
  "home.whyUs": "Trang chủ — Vì sao chọn SAIZA",
  "home.kol": "Trang chủ — KOL hợp tác",
  "home.news": "Trang chủ — Tin tức nổi bật",
  "home.offices": "Trang chủ — Văn phòng",
  "home.bottomCta": "Trang chủ — Kêu gọi liên hệ",
  productsPage: "Trang Sản phẩm",
  productDetail: "Trang chi tiết sản phẩm",
  aboutPage: "Trang Giới thiệu",
  partnersPage: "Trang Đối tác & Đại lý",
  newsPage: "Trang Tin tức",
  careersPage: "Trang Tuyển dụng",
  contactPage: "Trang Liên hệ",
  footer: "Chân trang (Footer)",
  offices: "Tên văn phòng",
};

export default async function SiteTextPage() {
  const profile = await getCurrentProfile();
  if (!profile || !(await canPublish(profile.role))) {
    return <p className="text-ink-2">Bạn không có quyền truy cập trang này.</p>;
  }

  const fields = flattenDictionary();
  const overrides = await getAllTextOverridesForAdmin();

  const byGroup = new Map<string, TextGroup>();
  for (const field of fields) {
    const override = overrides[field.key];
    const group = byGroup.get(field.group) ?? {
      groupKey: field.group,
      groupLabel: GROUP_LABELS[field.group] ?? field.group,
      fields: [],
      isOverridden: false,
    };
    group.fields.push({
      key: field.key,
      label: field.label,
      currentVi: override?.vi ?? field.defaultVi,
      currentEn: override?.en ?? field.defaultEn,
    });
    if (override) group.isOverridden = true;
    byGroup.set(field.group, group);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium">Nội dung trang web</h1>
        <p className="text-ink-2">
          Chỉnh mọi đoạn chữ hiển thị trên website (cả tiếng Việt và tiếng Anh). Thay đổi có hiệu lực ngay trên trang công khai sau khi lưu.
        </p>
      </div>
      <TextGroupsList groups={[...byGroup.values()]} />
    </div>
  );
}
