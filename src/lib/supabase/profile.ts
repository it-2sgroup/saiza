import { createClient } from "./server";
import { normalizeLarkPrefs, type LarkPrefs } from "@/lib/lark/prefs";

// Was a fixed 3-value union — now an arbitrary code referencing the
// admin-editable `roles` table (see supabase/migrations/0019_custom_roles.sql
// and src/lib/admin/roles.ts), so it's just a string here.
export type StaffRole = string;

export type Profile = {
  id: string;
  full_name: string;
  role: StaffRole;
  avatar_url: string | null;
  department: string | null;
  lark_prefs: LarkPrefs;
};

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url, department, lark_prefs")
    .eq("id", user.id)
    .single();

  if (!error) {
    return data ? ({ ...data, lark_prefs: normalizeLarkPrefs(data.lark_prefs) } as Profile) : null;
  }

  // Falls back to pre-migration-0011 columns (missing `lark_prefs`), then to
  // pre-migration-0010 columns (missing `department`) so a not-yet-applied
  // migration doesn't lock everyone out of every admin page — getCurrentProfile
  // gates the whole admin layout, not just one feature.
  const { data: withoutPrefs, error: withoutPrefsError } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url, department")
    .eq("id", user.id)
    .single();

  if (!withoutPrefsError) {
    return withoutPrefs ? ({ ...withoutPrefs, lark_prefs: {} } as Profile) : null;
  }

  const { data: base } = await supabase.from("profiles").select("id, full_name, role, avatar_url").eq("id", user.id).single();
  return base ? ({ ...base, department: null, lark_prefs: {} } as Profile) : null;
}
