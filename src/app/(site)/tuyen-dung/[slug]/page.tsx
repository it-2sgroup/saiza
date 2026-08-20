import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { getDictionary } from "@/lib/content/site-text";
import { getSiteConfig } from "@/lib/content/site-config";
import { JobDetailContent } from "./JobDetailContent";
import type { JobPost } from "@/lib/admin/types";

async function getJob(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("job_posts").select("*").eq("slug", slug).eq("status", "open").single();
  return data as JobPost | null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [job, dict] = await Promise.all([getJob(slug), getDictionary("vi")]);
  return { title: job ? `${job.title} | SAIZA` : `${dict.careersPage.title} | SAIZA` };
}

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [job, config] = await Promise.all([getJob(slug), getSiteConfig()]);
  if (!job) notFound();

  return (
    <Container as="section" className="max-w-[880px] pt-32 pb-24">
      <JobDetailContent job={job} applyFormUrl={config.applyFormUrl} />
    </Container>
  );
}
