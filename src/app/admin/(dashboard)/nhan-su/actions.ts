"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canManageStaff } from "@/lib/admin/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StaffRole } from "@/lib/supabase/profile";

export type StaffFormState = { error: string | null; success: boolean };

const VALID_ROLES: StaffRole[] = ["admin", "editor", "contributor"];

export async function inviteStaffAccount(_prev: StaffFormState, formData: FormData): Promise<StaffFormState> {
  const profile = await getCurrentProfile();
  if (!profile || !canManageStaff(profile.role)) return { error: "Bạn không có quyền thực hiện.", success: false };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "contributor") as StaffRole;

  if (!fullName || !email) {
    return { error: "Nhập đầy đủ họ tên và email.", success: false };
  }
  if (!VALID_ROLES.includes(role)) {
    return { error: "Vai trò không hợp lệ.", success: false };
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
    .insert({ id: invited.user.id, full_name: fullName, role });

  if (profileError) {
    return {
      error: `Đã gửi lời mời nhưng lưu hồ sơ thất bại: ${profileError.message}`,
      success: false,
    };
  }

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

  revalidatePath("/admin/nhan-su");
}
