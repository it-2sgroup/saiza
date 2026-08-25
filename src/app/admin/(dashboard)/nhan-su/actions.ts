"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canManageStaff } from "@/lib/admin/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAuditLog } from "@/lib/admin/audit";
import { DEPARTMENT_CODES } from "@/lib/admin/departments";
import type { StaffRole } from "@/lib/supabase/profile";

export type StaffFormState = { error: string | null; success: boolean };

const VALID_ROLES: StaffRole[] = ["admin", "editor", "contributor"];

export async function inviteStaffAccount(_prev: StaffFormState, formData: FormData): Promise<StaffFormState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageStaff(profile.role)) return { error: "Bạn không có quyền thực hiện.", success: false };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "contributor") as StaffRole;
  const department = String(formData.get("department") ?? "").trim();

  if (!fullName || !email) {
    return { error: "Nhập đầy đủ họ tên và email.", success: false };
  }
  if (!VALID_ROLES.includes(role)) {
    return { error: "Vai trò không hợp lệ.", success: false };
  }
  if (department && !DEPARTMENT_CODES.includes(department)) {
    return { error: "Mã phòng ban không hợp lệ.", success: false };
  }

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${siteUrl}/admin/set-password`,
  });

  if (inviteError || !invited.user) {
    return { error: `Không gửi được lời mời: ${inviteError?.message ?? "lỗi không xác định"}`, success: false };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: invited.user.id, full_name: fullName, role, department: department || null });

  if (profileError) {
    return {
      error: `Đã gửi lời mời nhưng lưu hồ sơ thất bại: ${profileError.message}`,
      success: false,
    };
  }

  await recordAuditLog({
    actorId: profile.id,
    action: "staff_invited",
    targetTable: "profiles",
    targetId: invited.user.id,
    metadata: { email, role },
  });

  revalidatePath("/admin/nhan-su");
  return { error: null, success: true };
}

export async function updateStaffRole(id: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || !canManageStaff(profile.role)) return;

  const role = String(formData.get("role") ?? "");
  if (!VALID_ROLES.includes(role as StaffRole)) return;

  const admin = createAdminClient();
  await admin.from("profiles").update({ role }).eq("id", id);

  await recordAuditLog({
    actorId: profile.id,
    action: "staff_role_changed",
    targetTable: "profiles",
    targetId: id,
    metadata: { newRole: role },
  });

  revalidatePath("/admin/nhan-su");
}

export async function updateStaffDepartment(id: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || !canManageStaff(profile.role)) return;

  const department = String(formData.get("department") ?? "").trim();
  if (department && !DEPARTMENT_CODES.includes(department)) return;

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ department: department || null })
    .eq("id", id);

  await recordAuditLog({
    actorId: profile.id,
    action: "staff_department_changed",
    targetTable: "profiles",
    targetId: id,
    metadata: { newDepartment: department || null },
  });

  revalidatePath("/admin/nhan-su");
}

export type DeleteStaffState = { error: string | null };

export async function deleteStaffAccount(
  id: string,
  _prev: DeleteStaffState,
  _formData: FormData,
): Promise<DeleteStaffState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageStaff(profile.role)) return { error: "Bạn không có quyền thực hiện." };
  if (id === profile.id) {
    return { error: "Dùng trang Hồ sơ cá nhân để xoá tài khoản của chính bạn." };
  }

  const admin = createAdminClient();

  const { data: target } = await admin.from("profiles").select("role, full_name").eq("id", id).single();

  if (target?.role === "admin") {
    const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
    if ((count ?? 0) <= 1) {
      return { error: "Không thể xoá quản trị viên duy nhất còn lại." };
    }
  }

  await recordAuditLog({
    actorId: profile.id,
    action: "staff_deleted",
    targetTable: "profiles",
    targetId: id,
    metadata: { fullName: target?.full_name, role: target?.role },
  });

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { error: `Không xoá được: ${error.message}` };

  revalidatePath("/admin/nhan-su");
  return { error: null };
}
