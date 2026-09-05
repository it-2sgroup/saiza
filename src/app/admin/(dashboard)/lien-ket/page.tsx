import { getCurrentProfile } from "@/lib/supabase/profile";
import { canPublish } from "@/lib/admin/permissions";
import { SITE_CONFIG_CATALOG, DEFAULT_SITE_CONFIG, getAllSiteConfigForAdmin } from "@/lib/content/site-config";
import { ConfigGroupEditor, type ConfigGroupField } from "./ConfigGroupEditor";

type Group = { groupKey: string; groupLabel: string; fields: ConfigGroupField[]; isOverridden: boolean };

export default async function SiteConfigPage() {
  const profile = await getCurrentProfile();
  if (!profile || !(await canPublish(profile.role))) {
    return <p className="text-ink-2">Bạn không có quyền truy cập trang này.</p>;
  }

  const overrides = await getAllSiteConfigForAdmin();

  const byGroup = new Map<string, Group>();
  for (const field of SITE_CONFIG_CATALOG) {
    const groupKey = field.key.split(".")[0];
    const group = byGroup.get(groupKey) ?? {
      groupKey,
      groupLabel: field.group,
      fields: [],
      isOverridden: false,
    };
    group.fields.push({
      key: field.key,
      label: field.label,
      placeholder: field.placeholder,
      currentValue: overrides[field.key] ?? DEFAULT_SITE_CONFIG[field.key] ?? "",
    });
    if (overrides[field.key] !== undefined) group.isOverridden = true;
    byGroup.set(groupKey, group);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium">Liên hệ & Liên kết</h1>
        <p className="text-ink-2">
          Số điện thoại, email, địa chỉ văn phòng, link mạng xã hội và các link ngoài khác dùng trên toàn website.
        </p>
      </div>
      <div className="flex flex-col gap-5">
        {[...byGroup.values()].map((group) => (
          <ConfigGroupEditor
            key={group.groupKey}
            groupKey={group.groupKey}
            groupLabel={group.groupLabel}
            fields={group.fields}
            isOverridden={group.isOverridden}
          />
        ))}
      </div>
    </div>
  );
}
