import { createClient } from "./server";

export type StaffRole = "admin" | "editor" | "contributor";

export type Profile = {
  id: string;
  full_name: string;
  role: StaffRole;
  avatar_url: string | null;
  department: string | null;
};

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url, department")
    .eq("id", user.id)
    .single();

  // Falls back to pre-migration-0010 columns so a not-yet-applied migration
  // (missing `department`) doesn't lock everyone out of every admin page —
  // getCurrentProfile gates the whole admin layout, not just this feature.
  if (error) {
    const { data: fallback } = await supabase
      .from("profiles")
      .select("id, full_name, role, avatar_url")
      .eq("id", user.id)
      .single();
    return fallback ? ({ ...fallback, department: null } as Profile) : null;
  }

  return (data as Profile) ?? null;
}
