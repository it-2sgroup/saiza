"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canManageStaff } from "@/lib/admin/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordAuditLog } from "@/lib/admin/audit";
import { getConfigLists } from "@/lib/admin/configLists";
import { getRoles } from "@/lib/admin/roles";
import { forceSyncTenantContacts } from "@/lib/lark/contactsCache";
import { friendlyError } from "@/lib/errors";
import type { StaffRole } from "@/lib/supabase/profile";

export type StaffFormState = { error: string | null; success: boolean };

// Counts staff currently holding ANY role with is_super_admin — the
// structural "true admin" tier, not just the literal code "admin" (which no
// longer means anything special by itself now that roles are custom). Used
// to stop the org ever being left with nobody who can administer it,
// whether by deleting the last one or demoting them to a lesser role.
async function countSuperAdmins(
  admin: ReturnType<typeof createAdminClient>,
): Promise<number> {
  const roles = await getRoles();
  const superAdminCodes = roles
    .filter((r) => r.isSuperAdmin)
    .map((r) => r.code);
  if (superAdminCodes.length === 0) return 0;
  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .in("role", superAdminCodes);
  return count ?? 0;
}

export async function inviteStaffAccount(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const profile = await getCurrentProfile();
  if (!profile || !(await canManageStaff(profile.role)))
    return { error: "Bạn không có quyền thực hiện.", success: false };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim() as StaffRole;
  const department = String(formData.get("department") ?? "").trim();

  if (!fullName || !email) {
    return { error: "Nhập đầy đủ họ tên và email.", success: false };
  }
  const roles = await getRoles();
  if (!roles.some((r) => r.code === role)) {
    return { error: "Vai trò không hợp lệ.", success: false };
  }
  if (department) {
    const { departments } = await getConfigLists();
    if (!departments.some((d) => d.code === department)) {
      return { error: "Mã phòng ban không hợp lệ.", success: false };
    }
  }

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data: invited, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: `${siteUrl}/admin/set-password`,
    });

  if (inviteError || !invited.user) {
    return {
      error: `Không gửi được lời mời: ${inviteError?.message ?? "lỗi không xác định"}`,
      success: false,
    };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .insert({
      id: invited.user.id,
      full_name: fullName,
      role,
      department: department || null,
    });

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
  if (!profile || !(await canManageStaff(profile.role))) return;

  const role = String(formData.get("role") ?? "");
  const roles = await getRoles();
  const newRole = roles.find((r) => r.code === role);
  if (!newRole) return;

  const admin = createAdminClient();

  // Same protection as deleteStaffAccount, extended to cover demotion —
  // moving the last super-admin-capable person to a lesser role leaves the
  // org exactly as unadministerable as deleting them would.
  if (!newRole.isSuperAdmin) {
    const { data: current } = await admin
      .from("profiles")
      .select("role")
      .eq("id", id)
      .maybeSingle();
    const currentRole = roles.find((r) => r.code === current?.role);
    if (currentRole?.isSuperAdmin && (await countSuperAdmins(admin)) <= 1)
      return;
  }

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
  if (!profile || !(await canManageStaff(profile.role))) return;

  const department = String(formData.get("department") ?? "").trim();
  if (department) {
    const { departments } = await getConfigLists();
    if (!departments.some((d) => d.code === department)) return;
  }

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
  if (!profile || !(await canManageStaff(profile.role)))
    return { error: "Bạn không có quyền thực hiện." };
  if (id === profile.id) {
    return {
      error: "Dùng trang Hồ sơ cá nhân để xoá tài khoản của chính bạn.",
    };
  }

  const admin = createAdminClient();

  const { data: target } = await admin
    .from("profiles")
    .select("role, full_name")
    .eq("id", id)
    .single();
  const roles = await getRoles();
  const targetRole = roles.find((r) => r.code === target?.role);

  if (targetRole?.isSuperAdmin && (await countSuperAdmins(admin)) <= 1) {
    return { error: "Không thể xoá quản trị viên duy nhất còn lại." };
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

export type SyncContactsState = { error: string | null; count?: number };

// Re-fetches every connected Lark app's directory live, ignoring the 30-min
// cache TTL — for the "Đồng bộ nhân viên Lark" button, so someone who just
// joined (or left) the Lark org shows up (or disappears) from the add-staff
// picker right away instead of whenever the TTL happens to lapse.
export async function syncLarkContactsAction(
  _prev: SyncContactsState,
  _formData: FormData,
): Promise<SyncContactsState> {
  const profile = await getCurrentProfile();
  if (!profile || !(await canManageStaff(profile.role)))
    return { error: "Bạn không có quyền thực hiện." };

  try {
    const count = await forceSyncTenantContacts();
    revalidatePath("/admin/nhan-su");
    revalidatePath("/admin/lark");
    return { error: null, count };
  } catch (err) {
    return {
      error: friendlyError(
        "syncLarkContactsAction",
        err,
        "Không đồng bộ được danh bạ Lark. Vui lòng thử lại sau ít phút.",
      ),
    };
  }
}
