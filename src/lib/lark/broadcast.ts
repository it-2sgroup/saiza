import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// A Server Action's revalidatePath() only refreshes the browser tab that ran
// it — a second tab/window already sitting on /admin/lark has no way to know
// a file was created/moved/trashed/restored/purged elsewhere until it's
// manually reloaded. This sends a content-free "something changed" Broadcast
// message (see LarkRealtimeSync.tsx for the receiving end); it carries no
// row data, so — unlike subscribing clients to lark_trash/audit_log directly
// — it needs no RLS changes to the tables those migrations deliberately
// locked down to service-role-only access.
export async function notifyLarkChanged(appKey: string): Promise<void> {
  try {
    const admin = createAdminClient();
    // Sending before subscribing uses a plain HTTP request under the hood
    // (per Supabase's Broadcast docs) — no persistent socket to manage from
    // a serverless Server Action.
    await admin.channel(`lark-sync:${appKey}`).send({
      type: "broadcast",
      event: "changed",
      payload: {},
    });
  } catch {
    // Best-effort — a missed refresh signal just means someone reloads
    // manually; it must never fail the mutation that triggered it.
  }
}
