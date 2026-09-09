import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createLarkFile,
  shareLarkDocByEmail,
  getAppRootFolderToken,
  getDefaultAppKey,
} from "./client";
import { addFolderToCache } from "./folders";
import { buildFolderName } from "@/lib/admin/fileNaming";

// Every staff member's confined root — "Nhân viên"-role accounts are forced
// to create files/subfolders only inside this (see the confinement checks
// in lark/actions.ts); roles with canManageLarkOrgWide are exempt and keep
// the free-pick folder behavior everywhere else in the app.
//
// Stays owned by the app's own service account forever — unlike individual
// files created inside it, this folder is never a candidate for the
// auto-ownership-transfer in createLarkDocument. If it were transferred
// away, the app would lose the ability to create anything else inside it
// (the exact "no permission" failure mode this whole feature exists
// alongside), defeating the point of a folder meant to keep receiving
// new files indefinitely.
export async function getOrCreatePersonalFolder(
  profileId: string,
  fullName: string,
  department: string | null,
  email: string | null,
  appKey: string = getDefaultAppKey(),
): Promise<string | undefined> {
  const admin = createAdminClient();

  const { data: existing, error: selectError } = await admin
    .from("lark_personal_folders")
    .select("lark_token")
    .eq("app_key", appKey)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (existing?.lark_token) return existing.lark_token;
  // Table not migrated yet — bail out rather than creating a fresh personal
  // folder on every single call until the migration runs (same reasoning as
  // getOrCreateDepartmentFolder's identical guard).
  if (selectError) return undefined;

  const parentToken = await getAppRootFolderToken(appKey);
  const name = buildFolderName({ org: null, department, name: fullName });

  let folderToken: string;
  let folderUrl: string;
  try {
    const created = await createLarkFile("folder", name, parentToken, appKey);
    folderToken = created.documentId;
    folderUrl = created.url;
  } catch {
    // Best-effort — the caller (invite flow, backfill, or the create-file
    // action's own JIT fallback) must not fail outright over this.
    return undefined;
  }

  // Insert-or-get: another request may be provisioning the same person's
  // folder concurrently (e.g. invite + a manual "Đồng bộ nhân viên Lark"
  // click racing). onConflict + ignoreDuplicates makes this a no-op if so,
  // then we always re-select to use whichever row actually won the race —
  // our own just-created folder becomes a harmless orphan in that rare case.
  await admin.from("lark_personal_folders").upsert(
    {
      app_key: appKey,
      profile_id: profileId,
      lark_token: folderToken,
      lark_url: folderUrl,
    },
    { onConflict: "app_key,profile_id", ignoreDuplicates: true },
  );

  const { data: winner } = await admin
    .from("lark_personal_folders")
    .select("lark_token")
    .eq("app_key", appKey)
    .eq("profile_id", profileId)
    .maybeSingle();
  const winningToken = winner?.lark_token ?? folderToken;

  if (winningToken === folderToken) {
    await addFolderToCache("", { token: folderToken, name, parentToken }, appKey);
    // Full-access, not ownership — so they can browse/manage it directly in
    // Lark too, without the app losing its own ability to keep creating
    // files inside it (see the doc comment at the top of this function).
    if (email) {
      await shareLarkDocByEmail(winningToken, email, "full_access", "folder", appKey).catch(
        () => {},
      );
    }
  }

  return winningToken;
}

/**
 * Read-only lookup for data.ts — building the confined folder picker on a
 * page render must never itself create a folder as a side effect of GET-ish
 * work. Returns null if the person doesn't have one yet (invited before
 * this feature existed, and "Đồng bộ nhân viên Lark" hasn't backfilled them
 * yet) — the create-file action's own JIT fallback covers that gap on the
 * next actual write.
 */
export async function getPersonalFolderToken(
  profileId: string,
  appKey: string,
): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("lark_personal_folders")
    .select("lark_token")
    .eq("app_key", appKey)
    .eq("profile_id", profileId)
    .maybeSingle();
  return data?.lark_token ?? null;
}

/**
 * Backfill for every staff account that predates this feature — run as part
 * of "Đồng bộ nhân viên Lark" (nhan-su/actions.ts's syncLarkContactsAction),
 * the same pairing backfillAvatarsFromLark already uses. Provisions for
 * EVERY profile regardless of role — the confinement itself is role-gated
 * elsewhere, but having a personal folder ready is harmless (and useful) for
 * roles that aren't confined to it too.
 */
export async function provisionMissingPersonalFolders(appKey: string): Promise<void> {
  const admin = createAdminClient();
  const [{ data: profiles }, { data: existing }, { data: usersData }] = await Promise.all([
    admin.from("profiles").select("id, full_name, department"),
    admin.from("lark_personal_folders").select("profile_id").eq("app_key", appKey),
    admin.auth.admin.listUsers(),
  ]);
  if (!profiles || profiles.length === 0) return;

  const provisioned = new Set((existing ?? []).map((r) => r.profile_id as string));
  const emailById = new Map(usersData?.users.map((u) => [u.id, u.email]) ?? []);

  for (const p of profiles) {
    if (provisioned.has(p.id as string)) continue;
    await getOrCreatePersonalFolder(
      p.id as string,
      p.full_name as string,
      p.department as string | null,
      emailById.get(p.id as string) ?? null,
      appKey,
    ).catch(() => {});
  }
}

/**
 * Re-applies full_access sharing for EVERY existing personal folder — run as
 * part of "Đồng bộ nhân viên Lark" right after provisionMissingPersonalFolders
 * above. getOrCreatePersonalFolder only ever shares once, at the moment a
 * folder is first created; if that single attempt failed silently (a
 * transient Lark error, or the person's contact record not cached yet), the
 * folder exists but they never got access, and nothing would ever notice or
 * retry short of someone manually checking Lark's own member list (as
 * happened once already). Re-sharing is a safe no-op for anyone already
 * shared — Lark's own add-member call just re-confirms the same grant.
 */
export async function reshareAllPersonalFolders(appKey: string): Promise<void> {
  const admin = createAdminClient();
  const [{ data: folders }, { data: usersData }] = await Promise.all([
    admin
      .from("lark_personal_folders")
      .select("profile_id, lark_token")
      .eq("app_key", appKey),
    admin.auth.admin.listUsers(),
  ]);
  if (!folders || folders.length === 0) return;

  const emailById = new Map(usersData?.users.map((u) => [u.id, u.email]) ?? []);

  for (const f of folders) {
    const email = emailById.get(f.profile_id as string);
    if (!email) continue;
    await shareLarkDocByEmail(
      f.lark_token as string,
      email,
      "full_access",
      "folder",
      appKey,
    ).catch(() => {});
  }
}
