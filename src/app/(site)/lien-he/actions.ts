"use server";

import { createClient } from "@/lib/supabase/server";
import { getClientIp, isRateLimited, recordEvent } from "@/lib/admin/rate-limit";

export type ContactFormState = { error: string | null; sent: boolean };

const MAX_SUBMISSIONS = 3;
const WINDOW_MINUTES = 10;

export async function submitContactForm(_prev: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const name = String(formData.get("contact-name") ?? "").trim();
  const phone = String(formData.get("contact-phone") ?? "").trim() || null;
  const email = String(formData.get("contact-email") ?? "").trim() || null;
  const region = String(formData.get("contact-region") ?? "").trim() || null;
  const message = String(formData.get("contact-message") ?? "").trim() || null;
  // Hidden field, invisible and unlabeled for real visitors — bots that
  // auto-fill every input tend to fill this in too. Pretend success without
  // writing anything so the bot doesn't learn the check exists.
  const honeypot = String(formData.get("company_website") ?? "").trim();

  if (honeypot) {
    return { error: null, sent: true };
  }

  if (!name) {
    return { error: "Vui lòng nhập tên.", sent: false };
  }

  const ip = await getClientIp();
  if (await isRateLimited("contact_submit", ip, MAX_SUBMISSIONS, WINDOW_MINUTES)) {
    return { error: "Bạn đã gửi quá nhiều lần. Vui lòng thử lại sau ít phút.", sent: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contact_submissions").insert({ name, phone, email, region, message });

  if (error) {
    return { error: "Không gửi được, vui lòng thử lại sau.", sent: false };
  }

  await recordEvent("contact_submit", ip);

  return { error: null, sent: true };
}
