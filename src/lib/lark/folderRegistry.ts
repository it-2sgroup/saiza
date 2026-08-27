import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createLarkFile, shareLarkDocByEmail } from "./client";
import { resolveRootFolderToken } from "./orgFolders";
import { departmentLabel } from "@/lib/admin/departments";

// Canonical folder per (org, department) — see supabase/migrations/0012_lark_folders.sql.
// Looked up first; created lazily (and auto-shared to the department's
// current staff) the first time it's needed. This is what makes files land
// in the same predictable place automatically instead of relying on someone
// manually creating/browsing a folder every time.
export async function getOrCreateDepartmentFolder(org: string, department: string): Promise<string | undefined> {
  const admin = createAdminClient();
  const orgKey = org || "";

  const { data: existing, error: selectError } = await admin
    .from("lark_folders")
    .select("lark_token")
    .eq("org", orgKey)
    .eq("department", department)
    .maybeSingle();
  if (existing?.lark_token) return existing.lark_token;
  // Table not migrated yet (see supabase/migrations/0012_lark_folders.sql) —
  // bail out to the plain org-root fallback in actions.ts instead of creating
  // a brand new department folder on every single file (nothing would ever
  // persist to dedupe against until the migration runs).
  if (selectError) return undefined;

  const parentToken = resolveRootFolderToken(org || null);
  if (!parentToken) return undefined;

  const name = org ? `${org} - ${departmentLabel(department) ?? department}` : departmentLabel(department) ?? department;

  let folderToken: string;
  let folderUrl: string;
  try {
    const created = await createLarkFile("folder", name, parentToken);
    folderToken = created.documentId;
    folderUrl = created.url;
  } catch {
    // Best-effort — fall back to the org root rather than failing file creation.
    return parentToken;
  }

  // Insert-or-get: another request may have created the same (org, department)
  // folder concurrently. onConflict + ignoreDuplicates makes this a no-op if
  // so, then we always re-select to use whichever row actually won the race
  // — our own just-created folder becomes a harmless orphan in that rare case.
  await admin
    .from("lark_folders")
    .upsert(
      { org: orgKey, department, lark_token: folderToken, lark_url: folderUrl },
      { onConflict: "org,department", ignoreDuplicates: true },
    );

  const { data: winner } = await admin
    .from("lark_folders")
    .select("lark_token")
    .eq("org", orgKey)
    .eq("department", department)
    .maybeSingle();
  const winningToken = winner?.lark_token ?? folderToken;

  // Best-effort: share the (newly won) department folder with everyone
  // currently assigned to that department, so files dropped in it are
  // visible without per-file "Chia sẻ thêm" clicks.
  try {
    const [{ data: deptProfiles }, { data: usersData }] = await Promise.all([
      admin.from("profiles").select("id").eq("department", department),
      admin.auth.admin.listUsers(),
    ]);
    const emailById = new Map(usersData?.users.map((u) => [u.id, u.email]) ?? []);
    const emails = (deptProfiles ?? []).map((p) => emailById.get(p.id as string)).filter((e): e is string => !!e);
    await Promise.all(emails.map((email) => shareLarkDocByEmail(winningToken, email, "full_access", "folder").catch(() => {})));
  } catch {
    // Non-fatal — folder still usable, just not pre-shared.
  }

  return winningToken;
}
