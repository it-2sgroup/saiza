import "server-only";
import { listTenantContacts, type LarkContact } from "./client";
import { createAdminClient } from "@/lib/supabase/admin";

// Contacts rarely change (new hires/departures are infrequent compared to
// how often /admin/lark is loaded), yet listTenantContacts hits Lark's
// Contact API (scopes lookup + chunked batch-users) fresh on every single
// page load, for every connected app — the single most wasteful Lark API
// call in the whole page. Cached here with a generous TTL, same
// stale-fallback pattern as listLarkFolderTree in folders.ts.
const CACHE_TTL_MS = 30 * 60 * 1000;

export async function listTenantContactsCached(appKey: string): Promise<LarkContact[]> {
  const admin = createAdminClient();

  const { data: cached, error } = await admin.from("lark_contact_cache").select("contacts, updated_at").eq("app_key", appKey).maybeSingle();

  if (!error && cached && Date.now() - new Date(cached.updated_at).getTime() < CACHE_TTL_MS) {
    return cached.contacts as LarkContact[];
  }

  const contacts = await listTenantContacts(appKey);

  if (!error) {
    await admin.from("lark_contact_cache").upsert({ app_key: appKey, contacts, updated_at: new Date().toISOString() });
  }

  return contacts;
}
