"use server";

import { createClient } from "@/lib/supabase/server";
import { validatePassword } from "@/lib/admin/password";
import { decodeJwtClaims } from "@/lib/admin/jwt";

export type SetPasswordState = { error: string | null; success: boolean };

// This page is meant for ONE moment: right after clicking an invite/recovery
// email link, before a password has ever been set. It deliberately skips the
// "confirm your current password" re-auth that changePassword (ho-so/actions.ts)
// requires — that's fine for a brand-new invite session, but if reached from
// an ordinary already-logged-in-with-a-password session (e.g. an unattended
// browser), it would let anyone with momentary physical/browser access take
// over the account with no re-auth at all, which is exactly the scenario
// changePassword's re-auth exists to prevent.
//
// Supabase's JWT carries `amr` (authentication methods reference) — the most
// recent entry is how the CURRENT session was established. An invite/
// recovery link produces an "otp"/"magiclink" entry; a normal login produces
// "password". Rejecting the latter here closes the bypass without touching
// the legitimate invite flow at all.
function establishedViaPasswordLogin(accessToken: string): boolean {
  const claims = decodeJwtClaims(accessToken);
  const amr = claims?.amr;
  if (!Array.isArray(amr) || amr.length === 0) return false;
  const latest = amr[amr.length - 1] as { method?: string } | undefined;
  return latest?.method === "password";
}

export async function setPassword(_prev: SetPasswordState, formData: FormData): Promise<SetPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password !== confirm) {
    return { error: "Hai mật khẩu không khớp.", success: false };
  }

  // The client-side password check on this page can always be bypassed by
  // calling the Supabase API directly, so the real password policy is
  // enforced here, server-side, before the update is allowed through.
  const check = validatePassword(password);
  if (!check.valid) {
    return { error: check.error, success: false };
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { error: "Đường dẫn không hợp lệ hoặc đã hết hạn. Hãy xin quản trị viên gửi lời mời lại.", success: false };
  }

  if (establishedViaPasswordLogin(session.access_token)) {
    return {
      error: "Đây không phải đường dẫn mời/đặt lại mật khẩu. Để đổi mật khẩu, vào Hồ sơ → Đổi mật khẩu.",
      success: false,
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: `Không đặt được mật khẩu: ${error.message}`, success: false };
  }

  return { error: null, success: true };
}
