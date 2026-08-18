import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type AuditLogParams = {
  actorId?: string | null;
  action: string;
  targetTable?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
};

// Writes with the service-role client only — callers must have already
// checked the caller's own permission before logging the action, since this
// bypasses RLS and never rejects on its own.
export async function recordAuditLog({ actorId, action, targetTable, targetId, metadata }: AuditLogParams) {
  const admin = createAdminClient();
  await admin.from("audit_log").insert({
    actor_id: actorId ?? null,
    action,
    target_table: targetTable ?? null,
    target_id: targetId ?? null,
    metadata: metadata ?? null,
  });
}
