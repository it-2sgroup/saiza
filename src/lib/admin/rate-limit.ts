import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = h.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

/**
 * Checks whether `key` has already hit `maxAttempts` recorded events of
 * `kind` within the last `windowMinutes`. Fails OPEN on infra errors (lets
 * the request through) rather than closed — a broken rate-limit check
 * should never turn into a self-inflicted lockout of every admin.
 */
export async function isRateLimited(kind: string, key: string, maxAttempts: number, windowMinutes: number) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("count_recent_events", {
    p_kind: kind,
    p_key: key,
    p_minutes: windowMinutes,
  });
  if (error) return false;
  return (data ?? 0) >= maxAttempts;
}

export async function recordEvent(kind: string, key: string) {
  const admin = createAdminClient();
  await admin.from("rate_limit_log").insert({ kind, key });
}
