"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { validatePassword } from "@/lib/admin/password";
import { recordAuditLog } from "@/lib/admin/audit";

export type ProfileFormState = { error: string | null; success: boolean };

export async function updateFullName(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại.", success: false };

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { error: "Họ tên không được để trống.", success: false };

  // Uses the service-role client, but the update is hard-coded to only ever
  // touch `full_name` here — never forward arbitrary fields from the form,
  // since that's what would let a non-admin sneak a role change through.
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ full_name: fullName }).eq("id", profile.id);
  if (error) return { error: `Không lưu được: ${error.message}`, success: false };

  await recordAuditLog({
    actorId: profile.id,
    action: "profile_updated",
    targetTable: "profiles",
    targetId: profile.id,
    metadata: { fullName },
  });

  revalidatePath("/admin/ho-so");
  return { error: null, success: true };
}

export type ChangePasswordState = { error: string | null; success: boolean };

export async function changePassword(_prev: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (!currentPassword) return { error: "Nhập mật khẩu hiện tại.", success: false };
  if (newPassword !== confirm) return { error: "Hai mật khẩu mới không khớp.", success: false };

  const check = validatePassword(newPassword);
  if (!check.valid) return { error: check.error, success: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Bạn cần đăng nhập lại.", success: false };

  // Re-verify identity before allowing a password change, even though the
  // caller already has a valid session — protects against someone using an
  // unattended, still-logged-in browser to hijack the account outright.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (reauthError) return { error: "Mật khẩu hiện tại không đúng.", success: false };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: `Không đổi được mật khẩu: ${error.message}`, success: false };

  await recordAuditLog({ actorId: user.id, action: "password_changed" });

  return { error: null, success: true };
}

export type DeleteAccountState = { error: string | null };

const DELETE_CONFIRM_PHRASE = "XOA TAI KHOAN";

export async function deleteOwnAccount(_prev: DeleteAccountState, formData: FormData): Promise<DeleteAccountState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Bạn cần đăng nhập lại." };

  const confirmText = String(formData.get("confirm_text") ?? "");
  if (confirmText !== DELETE_CONFIRM_PHRASE) {
    return { error: `Nhập đúng "${DELETE_CONFIRM_PHRASE}" để xác nhận.` };
  }

  const admin = createAdminClient();

  if (profile.role === "admin") {
    const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
    if ((count ?? 0) <= 1) {
      return { error: "Bạn là quản trị viên duy nhất — hãy chỉ định quản trị viên khác trước khi xoá tài khoản này." };
    }
  }

  // Logged before deletion: audit_log.actor_id references profiles(id), so
  // this insert must happen while the row still exists. The FK is
  // ON DELETE SET NULL, so once the profile is gone the reference clears
  // itself automatically — the fullName/role captured in metadata is what
  // keeps this entry meaningful afterwards.
  await recordAuditLog({
    actorId: profile.id,
    action: "account_self_deleted",
    targetTable: "profiles",
    targetId: profile.id,
    metadata: { fullName: profile.full_name, role: profile.role },
  });

  const { error } = await admin.auth.admin.deleteUser(profile.id);
  if (error) return { error: `Không xoá được: ${error.message}` };

  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/admin/login");
}
