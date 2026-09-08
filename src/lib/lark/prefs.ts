// A saved, named snapshot of the naming-convention toggles/values (not
// `content` — that's typed fresh every time, a template is just the
// surrounding prefix/suffix rules) — lets someone who regularly creates the
// same kind of file (e.g. "Báo cáo tuần SAIZA-KT, có ngày, không version")
// re-apply that whole setup in one click instead of re-toggling every field.
export type LarkNamingTemplate = {
  id: string;
  name: string;
  includeDept: boolean;
  includeDocType: boolean;
  includeDate: boolean;
  includeVersion: boolean;
  org: string;
  department: string;
  docType: string;
  version: string;
  wip: boolean;
};

// Per-employee default settings for the file-naming form, stored in
// profiles.lark_prefs (JSONB) — see supabase/migrations/0011_lark_prefs.sql.
export type LarkPrefs = {
  includeDept?: boolean;
  includeDocType?: boolean;
  includeDate?: boolean;
  includeVersion?: boolean;
  defaultOrg?: string;
  defaultVersion?: string;
  // Preset values for the two components that previously had no way to
  // customize beyond on/off — department defaults to the employee's own
  // profile department if unset, doc type defaults to "Báo Cáo".
  defaultDepartment?: string;
  defaultDocType?: string;
  // Which connected Lark app (see LARK_APPS) this employee is currently
  // acting as — different apps have separate Drive spaces/folder trees.
  activeApp?: string;
  // Saved naming-convention presets — see LarkNamingTemplate above.
  templates?: LarkNamingTemplate[];
};

export const DEFAULT_LARK_PREFS: Required<
  Pick<
    LarkPrefs,
    "includeDept" | "includeDocType" | "includeDate" | "includeVersion"
  >
> = {
  includeDept: true,
  includeDocType: true,
  includeDate: true,
  includeVersion: true,
};

function normalizeLarkNamingTemplate(raw: unknown): LarkNamingTemplate | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Record<string, unknown>;
  if (
    typeof t.id !== "string" ||
    typeof t.name !== "string" ||
    !t.id ||
    !t.name
  )
    return null;
  return {
    id: t.id,
    name: t.name,
    includeDept: typeof t.includeDept === "boolean" ? t.includeDept : false,
    includeDocType:
      typeof t.includeDocType === "boolean" ? t.includeDocType : false,
    includeDate: typeof t.includeDate === "boolean" ? t.includeDate : false,
    includeVersion:
      typeof t.includeVersion === "boolean" ? t.includeVersion : false,
    org: typeof t.org === "string" ? t.org : "",
    department: typeof t.department === "string" ? t.department : "",
    docType: typeof t.docType === "string" ? t.docType : "",
    version: typeof t.version === "string" ? t.version : "",
    wip: typeof t.wip === "boolean" ? t.wip : false,
  };
}

export function normalizeLarkPrefs(raw: unknown): LarkPrefs {
  if (!raw || typeof raw !== "object") return {};
  const p = raw as Record<string, unknown>;
  const prefs: LarkPrefs = {};
  if (typeof p.includeDept === "boolean") prefs.includeDept = p.includeDept;
  if (typeof p.includeDocType === "boolean")
    prefs.includeDocType = p.includeDocType;
  if (typeof p.includeDate === "boolean") prefs.includeDate = p.includeDate;
  if (typeof p.includeVersion === "boolean")
    prefs.includeVersion = p.includeVersion;
  if (typeof p.defaultOrg === "string") prefs.defaultOrg = p.defaultOrg;
  if (typeof p.defaultVersion === "string")
    prefs.defaultVersion = p.defaultVersion;
  if (typeof p.defaultDepartment === "string")
    prefs.defaultDepartment = p.defaultDepartment;
  if (typeof p.defaultDocType === "string")
    prefs.defaultDocType = p.defaultDocType;
  if (typeof p.activeApp === "string") prefs.activeApp = p.activeApp;
  if (Array.isArray(p.templates)) {
    const templates = p.templates
      .map(normalizeLarkNamingTemplate)
      .filter((t): t is LarkNamingTemplate => t !== null);
    if (templates.length > 0) prefs.templates = templates;
  }
  return prefs;
}
