"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClientIp, isRateLimited, recordEvent } from "@/lib/admin/rate-limit";
import { recordAuditLog } from "@/lib/admin/audit";

export type LoginState = { error: string | null };

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Nhập đầy đủ email và mật khẩu." };
  }

  const ip = await getClientIp();
  const rateLimitKey = `${email}:${ip}`;

  if (await isRateLimited("login_fail", rateLimitKey, MAX_FAILED_ATTEMPTS, WINDOW_MINUTES)) {
    return { error: "Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    await recordEvent("login_fail", rateLimitKey);
    await recordAuditLog({ action: "login_failed", metadata: { email, ip } });
    return { error: "Email hoặc mật khẩu không đúng." };
  }

  await recordAuditLog({ actorId: data.user?.id, action: "login_success", metadata: { email, ip } });

  redirect("/admin");
}
