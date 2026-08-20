import { getCurrentProfile } from "@/lib/supabase/profile";
import { canPublish } from "@/lib/admin/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_IMAGE_CATALOG } from "@/lib/content/site-images";
import { SiteImageCard } from "./SiteImageCard";
import { SiteImageListEditor } from "./SiteImageListEditor";

export default async function SiteImagesPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canPublish(profile.role)) {
    return <p className="text-ink-2">Bạn không có quyền truy cập trang này.</p>;
  }

  const admin = createAdminClient();
  const [{ data: fixedRows }, { data: itemRows }] = await Promise.all([
    admin.from("site_images").select("key, url"),
    admin
      .from("site_image_items")
      .select("id, list_key, url, label")
      .order("sort_order", { ascending: true }),
  ]);

  const overrides = new Map((fixedRows ?? []).map((row) => [row.key, row.url]));
  const itemsByList = new Map<string, { id: string; url: string; label: string | null }[]>();
  for (const row of itemRows ?? []) {
    const list = itemsByList.get(row.list_key) ?? [];
    list.push({ id: row.id, url: row.url, label: row.label });
    itemsByList.set(row.list_key, list);
  }

  const groups = new Map<string, typeof SITE_IMAGE_CATALOG>();
  for (const item of SITE_IMAGE_CATALOG) {
    const list = groups.get(item.group) ?? [];
    list.push(item);
    groups.set(item.group, list);
  }

  return (
    <div className="flex flex-col gap-9">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium">Hình ảnh trang web</h1>
        <p className="text-ink-2">
          Thay ảnh hiển thị trên website. Thay đổi có hiệu lực ngay trên trang công khai sau khi tải lên.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Thương hiệu</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {(groups.get("Thương hiệu") ?? []).map((item) => (
            <SiteImageCard
              key={item.key}
              itemKey={item.key}
              label={item.label}
              currentUrl={overrides.get(item.key) ?? item.defaultUrl}
              isOverridden={overrides.has(item.key)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Trang chủ — Banner đầu trang</h2>
        <SiteImageListEditor listKey="hero" items={itemsByList.get("hero") ?? []} addLabel="Thêm banner" />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Trang chủ — Vì sao chọn SAIZA</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {(groups.get("Trang chủ — Vì sao chọn SAIZA") ?? []).map((item) => (
            <SiteImageCard
              key={item.key}
              itemKey={item.key}
              label={item.label}
              currentUrl={overrides.get(item.key) ?? item.defaultUrl}
              isOverridden={overrides.has(item.key)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Trang chủ — KOL hợp tác</h2>
        <SiteImageListEditor listKey="kol" items={itemsByList.get("kol") ?? []} withLabel addLabel="Thêm KOL" />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Giới thiệu</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {(groups.get("Giới thiệu") ?? []).map((item) => (
            <SiteImageCard
              key={item.key}
              itemKey={item.key}
              label={item.label}
              currentUrl={overrides.get(item.key) ?? item.defaultUrl}
              isOverridden={overrides.has(item.key)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Giới thiệu — Thư viện ảnh</h2>
        <SiteImageListEditor listKey="gallery" items={itemsByList.get("gallery") ?? []} addLabel="Thêm ảnh" />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Đối tác & Đại lý</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {(groups.get("Đối tác & Đại lý") ?? []).map((item) => (
            <SiteImageCard
              key={item.key}
              itemKey={item.key}
              label={item.label}
              currentUrl={overrides.get(item.key) ?? item.defaultUrl}
              isOverridden={overrides.has(item.key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
