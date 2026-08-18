"use server";

import { createClient } from "@/lib/supabase/server";
import { validatePassword } from "@/lib/admin/password";

export type SetPasswordState = { error: string | null; success: boolean };

// The client-side password check on this page can always be bypassed by
// calling the Supabase API directly, so the real password policy is
// enforced here, server-side, before the update is allowed through.
export async function setPassword(_prev: SetPasswordState, formData: FormData): Promise<SetPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password !== confirm) {
    return { error: "Hai mật khẩu không khớp.", success: false };
  }

  const check = validatePassword(password);
  if (!check.valid) {
    return { error: check.error, success: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Đường dẫn không hợp lệ hoặc đã hết hạn. Hãy xin quản trị viên gửi lời mời lại.", success: false };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: `Không đặt được mật khẩu: ${error.message}`, success: false };
  }

  return { error: null, success: true };
}
