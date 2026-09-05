import "server-only";
import { listTenantContacts, getLarkApps, type LarkContact } from "./client";
import { createAdminClient } from "@/lib/supabase/admin";

// Contacts rarely change (new hires/departures are infrequent compared to
// how often /admin/lark is loaded), yet listTenantContacts hits Lark's
// Contact API (scopes lookup + chunked batch-users) fresh on every single
// page load, for every connected app — the single most wasteful Lark API
// call in the whole page. Cached here with a generous TTL, same
// stale-fallback pattern as listLarkFolderTree in folders.ts.
const CACHE_TTL_MS = 30 * 60 * 1000;

export async function listTenantContactsCached(
  appKey: string,
): Promise<LarkContact[]> {
  const admin = createAdminClient();

  const { data: cached, error } = await admin
    .from("lark_contact_cache")
    .select("contacts, updated_at")
    .eq("app_key", appKey)
    .maybeSingle();

  if (
    !error &&
    cached &&
    Date.now() - new Date(cached.updated_at).getTime() < CACHE_TTL_MS
  ) {
    return cached.contacts as LarkContact[];
  }

  const contacts = await listTenantContacts(appKey);

  if (!error) {
    await admin
      .from("lark_contact_cache")
      .upsert({
        app_key: appKey,
        contacts,
        updated_at: new Date().toISOString(),
      });
  }

  return contacts;
}

/**
 * Every connected app's directory, merged and deduped by email — the same
 * pool the Lark tab's share/transfer-owner picker draws from (see
 * lark/data.ts), pulled out here so Nhân sự's "add via Lark" picker can use
 * the exact same list without duplicating the merge/dedupe logic.
 */
export async function listAllTenantContactsMerged(): Promise<LarkContact[]> {
  const apps = getLarkApps();
  const byApp = await Promise.all(
    apps.map((a) => listTenantContactsCached(a.key).catch(() => [])),
  );
  const seenEmails = new Set<string>();
  const merged: LarkContact[] = [];
  for (const contacts of byApp) {
    for (const c of contacts) {
      const key = c.email.toLowerCase();
      if (!key || seenEmails.has(key)) continue;
      seenEmails.add(key);
      merged.push(c);
    }
  }
  return merged;
}

/**
 * Bypasses the cache TTL entirely and re-fetches every connected app's
 * directory straight from Lark — for the "Đồng bộ nhân viên Lark" button.
 * People who joined/left the Lark org since the last 30-minute-TTL refresh
 * won't show up (or won't disappear) from the add-staff picker until either
 * this runs or the TTL happens to lapse on its own; this makes it immediate
 * and on-demand instead of "wait and hope".
 */
export async function forceSyncTenantContacts(): Promise<number> {
  const admin = createAdminClient();
  const apps = getLarkApps();
  const byApp = await Promise.all(
    apps.map(async (a) => {
      const contacts = await listTenantContacts(a.key);
      await admin
        .from("lark_contact_cache")
        .upsert({
          app_key: a.key,
          contacts,
          updated_at: new Date().toISOString(),
        });
      return contacts;
    }),
  );
  const seenEmails = new Set<string>();
  let total = 0;
  for (const contacts of byApp) {
    for (const c of contacts) {
      const key = c.email.toLowerCase();
      if (!key || seenEmails.has(key)) continue;
      seenEmails.add(key);
      total++;
    }
  }
  return total;
}
