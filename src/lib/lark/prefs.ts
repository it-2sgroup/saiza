// Per-employee default settings for the file-naming form, stored in
// profiles.lark_prefs (JSONB) — see supabase/migrations/0011_lark_prefs.sql.
export type LarkPrefs = {
  includeDept?: boolean;
  includeDocType?: boolean;
  includeDate?: boolean;
  includeVersion?: boolean;
  defaultOrg?: string;
  defaultVersion?: string;
};

export const DEFAULT_LARK_PREFS: Required<
  Pick<LarkPrefs, "includeDept" | "includeDocType" | "includeDate" | "includeVersion">
> = {
  includeDept: true,
  includeDocType: true,
  includeDate: true,
  includeVersion: true,
};

export function normalizeLarkPrefs(raw: unknown): LarkPrefs {
  if (!raw || typeof raw !== "object") return {};
  const p = raw as Record<string, unknown>;
  const prefs: LarkPrefs = {};
  if (typeof p.includeDept === "boolean") prefs.includeDept = p.includeDept;
  if (typeof p.includeDocType === "boolean") prefs.includeDocType = p.includeDocType;
  if (typeof p.includeDate === "boolean") prefs.includeDate = p.includeDate;
  if (typeof p.includeVersion === "boolean") prefs.includeVersion = p.includeVersion;
  if (typeof p.defaultOrg === "string") prefs.defaultOrg = p.defaultOrg;
  if (typeof p.defaultVersion === "string") prefs.defaultVersion = p.defaultVersion;
  return prefs;
}
