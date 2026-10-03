import type { Metadata } from "next";
import { getSortedCampaigns, toPublicCampaign } from "@/lib/content/campaigns";
import { ActivitiesPageContent } from "./ActivitiesPageContent";

export const metadata: Metadata = {
  title: "Hoạt động | SAIZA",
  description:
    "Các chương trình khuyến mãi, trúng thưởng và hoạt động dành cho khách hàng SAIZA. Thể lệ đầy đủ được công bố công khai.",
};

export default function ActivitiesPage() {
  return <ActivitiesPageContent campaigns={getSortedCampaigns().map(toPublicCampaign)} />;
}
