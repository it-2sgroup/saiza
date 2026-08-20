import type { Metadata } from "next";
import { ContactPageContent } from "./ContactPageContent";
import { getOfficesConfig, getSiteConfig } from "@/lib/content/site-config";

export const metadata: Metadata = {
  title: "Liên hệ | SAIZA",
};

export default async function ContactPage() {
  const [config, offices] = await Promise.all([getSiteConfig(), getOfficesConfig()]);

  return (
    <ContactPageContent
      phone={config.phone}
      email={config.email}
      office1Address={config.office1Address}
      office2Address={config.office2Address}
      offices={offices}
    />
  );
}
