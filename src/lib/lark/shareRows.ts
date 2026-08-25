import "server-only";
import { shareLarkDocByEmail } from "./client";

export type SharePerm = "view" | "edit" | "full_access";
export type ShareRow = { email: string; perm: SharePerm };
export type ShareResult = { email: string; ok: boolean };

const VALID_PERMS: SharePerm[] = ["view", "edit", "full_access"];

export function parseShareRows(raw: string): ShareRow[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const seen = new Set<string>();
  const rows: ShareRow[] = [];
  for (const item of parsed) {
    if (typeof item !== "object" || item === null) continue;
    const email = String((item as { email?: unknown }).email ?? "").trim();
    const perm = String((item as { perm?: unknown }).perm ?? "");
    if (!email || seen.has(email) || !VALID_PERMS.includes(perm as SharePerm)) continue;
    seen.add(email);
    rows.push({ email, perm: perm as SharePerm });
  }
  return rows;
}

export async function applyShareRows(documentId: string, rows: ShareRow[]): Promise<ShareResult[]> {
  const results: ShareResult[] = [];
  for (const row of rows) {
    try {
      await shareLarkDocByEmail(documentId, row.email, row.perm);
      results.push({ email: row.email, ok: true });
    } catch {
      results.push({ email: row.email, ok: false });
    }
  }
  return results;
}
