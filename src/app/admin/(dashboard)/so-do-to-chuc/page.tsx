import { getCurrentProfile } from "@/lib/supabase/profile";
import { canManageStaff } from "@/lib/admin/permissions";
import { getOrgChartData } from "./data";
import { OrgChartEditor } from "./OrgChartEditor";

export default async function OrgChartPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return <p className="text-ink-2">Bạn cần đăng nhập lại.</p>;
  }

  // Viewing is open to anyone with an admin login (same posture as Tổng
  // quan) — an org chart is only useful if everyone can see where they and
  // their colleagues sit. Editing (dragging boxes, renaming, assigning
  // people) is gated on canManageStaff, the same capability Nhân sự already
  // uses — maintaining the company structure is an HR/admin function, not
  // something every viewer should be able to rearrange.
  const canEdit = await canManageStaff(profile.role);
  const data = await getOrgChartData();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium">Sơ đồ tổ chức</h1>
        <p className="text-ink-2">
          {canEdit
            ? "Kéo thả để sắp xếp, nối dây giữa các ô, bấm mũi tên dưới mỗi ô để xem/thêm thành viên."
            : "Bấm mũi tên dưới mỗi ô để xem thành viên."}
        </p>
      </div>
      <OrgChartEditor data={data} canEdit={canEdit} />
    </div>
  );
}
