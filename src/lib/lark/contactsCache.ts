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
    await admin.from("lark_contact_cache").upsert({
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
 * lark/data.ts). Sharing/transferring a file only cares "is this a real
 * person I can reach", so one row per person (not per org) is correct there.
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

export type OrgContact = LarkContact & { orgKey: string; orgLabel: string };

// koc-booking is a shared internal tool, not a real organization with its
// own headcount — Nhân sự's "how many people across our orgs" tally should
// exclude it, same as when someone manually counts members per org.
const NON_ORG_APP_KEYS = new Set(["koc-booking"]);

/**
 * Every real org's directory, one row PER ORG MEMBERSHIP — deliberately not
 * deduped. Someone who works across e.g. SAIZA and SISMO shows up twice,
 * tagged with which org each row is from: that matches how an admin counts
 * heads by walking each org's member list (they'd count that person twice
 * too), and headcount tallies (see forceSyncTenantContacts) need to agree
 * with that count. listAllTenantContactsMerged stays deduped for the
 * share/transfer picker, where "which org" doesn't matter — this is for
 * Nhân sự's "add from Lark" picker, where org context does.
 */
export async function listOrgContactsForStaffPicker(): Promise<OrgContact[]> {
  const apps = getLarkApps().filter((a) => !NON_ORG_APP_KEYS.has(a.key));
  const byApp = await Promise.all(
    apps.map((a) => listTenantContactsCached(a.key).catch(() => [])),
  );
  const result: OrgContact[] = [];
  apps.forEach((app, i) => {
    for (const c of byApp[i]) {
      result.push({ ...c, orgKey: app.key, orgLabel: app.label });
    }
  });
  return result;
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
      await admin.from("lark_contact_cache").upsert({
        app_key: a.key,
        contacts,
        updated_at: new Date().toISOString(),
      });
      return { key: a.key, contacts };
    }),
  );
  // Reported count is a raw sum per real org, NOT deduped across orgs and
  // NOT counting internal tool apps (koc-booking) — this matches how an
  // admin tallies headcount by walking each org's member page and adding
  // it up, counting someone who works across two orgs twice. See
  // listOrgContactsForStaffPicker, which the add-staff picker uses and
  // agrees with this same count.
  return byApp
    .filter((a) => !NON_ORG_APP_KEYS.has(a.key))
    .reduce((sum, a) => sum + a.contacts.length, 0);
}
