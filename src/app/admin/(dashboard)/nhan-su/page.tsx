import { getCurrentProfile } from "@/lib/supabase/profile";
import { canManageStaff, ROLE_LABELS } from "@/lib/admin/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { StaffForm } from "./StaffForm";
import { RoleSelect } from "./RoleSelect";
import { DeleteStaffButton } from "./DeleteStaffButton";
import { Avatar } from "../Avatar";
import type { StaffRole } from "@/lib/supabase/profile";

type StaffRow = { id: string; full_name: string; role: StaffRole; avatar_url: string | null; created_at: string };

export default async function AdminStaffPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageStaff(profile.role)) {
    return <p className="text-ink-2">Bạn không có quyền truy cập trang này.</p>;
  }

  const admin = createAdminClient();
  const [{ data: profilesData }, { data: usersData }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, role, avatar_url, created_at")
      .order("created_at", { ascending: false }),
    admin.auth.admin.listUsers(),
  ]);

  const emailById = new Map(usersData?.users.map((u) => [u.id, u.email]) ?? []);
  const staff = (profilesData ?? []) as StaffRow[];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium">Nhân sự</h1>
        <p className="text-ink-2">Tạo tài khoản và phân quyền cho nhân viên truy cập khu quản trị.</p>
      </div>

      <div className="flex flex-col gap-3">
        {staff.map((person) => (
          <div
            key={person.id}
            className="flex items-center justify-between gap-4 rounded-card border border-line bg-card p-5"
          >
            <div className="flex items-center gap-3.5">
              <Avatar fullName={person.full_name} avatarUrl={person.avatar_url} />
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{person.full_name}</span>
                <span className="text-xs text-ink-2">{emailById.get(person.id) ?? "—"}</span>
              </div>
            </div>
            {person.id === profile.id ? (
              <span className="text-sm text-ink-2">{ROLE_LABELS[person.role]} (bạn)</span>
            ) : (
              <div className="flex items-center gap-2.5">
                <RoleSelect id={person.id} role={person.role} />
                <DeleteStaffButton id={person.id} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="max-w-[480px] rounded-card border border-line bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Thêm nhân viên mới</h2>
        <StaffForm />
      </div>
    </div>
  );
}
