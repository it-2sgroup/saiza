import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { NewsPageContent } from "./NewsPageContent";
import type { NewsPost } from "@/lib/admin/types";

export const metadata: Metadata = {
  title: "Tin tức | SAIZA",
};

export default async function NewsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  return <NewsPageContent posts={(data ?? []) as NewsPost[]} />;
}
