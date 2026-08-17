import { createClient } from "./server";

export type StaffRole = "admin" | "editor" | "contributor";

export type Profile = {
  id: string;
  full_name: string;
  role: StaffRole;
};

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("id, full_name, role").eq("id", user.id).single();
  return (data as Profile) ?? null;
}
