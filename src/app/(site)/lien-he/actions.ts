"use server";

import { createClient } from "@/lib/supabase/server";

export type ContactFormState = { error: string | null; sent: boolean };

export async function submitContactForm(_prev: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const name = String(formData.get("contact-name") ?? "").trim();
  const phone = String(formData.get("contact-phone") ?? "").trim() || null;
  const email = String(formData.get("contact-email") ?? "").trim() || null;
  const region = String(formData.get("contact-region") ?? "").trim() || null;
  const message = String(formData.get("contact-message") ?? "").trim() || null;

  if (!name) {
    return { error: "Vui lòng nhập tên.", sent: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contact_submissions").insert({ name, phone, email, region, message });

  if (error) {
    return { error: "Không gửi được, vui lòng thử lại sau.", sent: false };
  }

  return { error: null, sent: true };
}
