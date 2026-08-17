import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CareersPageContent } from "./CareersPageContent";
import type { JobPost } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Tuyển dụng | SAIZA",
};

export default async function CareersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("job_posts")
    .select("*")
    .eq("status", "open")
    .order("published_at", { ascending: false });

  return <CareersPageContent jobs={(data ?? []) as JobPost[]} />;
}
