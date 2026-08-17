"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canViewInbox } from "@/lib/admin/permissions";

export async function updateSubmissionStatus(id: string, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || !canViewInbox(profile.role)) return;

  const status = String(formData.get("status") ?? "new");

  const supabase = await createClient();
  await supabase.from("contact_submissions").update({ status }).eq("id", id);

  revalidatePath("/admin/lien-he");
}
