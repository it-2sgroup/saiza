import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CAMPAIGNS, getCampaignBySlug } from "@/lib/content/campaigns";
import { CampaignDetailContent } from "./CampaignDetailContent";

export function generateStaticParams() {
  return CAMPAIGNS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const campaign = getCampaignBySlug(slug);
  if (!campaign) return { title: "Hoạt động | SAIZA" };
  return {
    title: `${campaign.name.vi} | SAIZA`,
    description: campaign.summary.vi,
  };
}

export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = getCampaignBySlug(slug);
  if (!campaign) notFound();

  return <CampaignDetailContent campaign={campaign} />;
}
