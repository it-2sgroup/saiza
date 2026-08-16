import type { Metadata } from "next";
import { ContactPageContent } from "./ContactPageContent";

export const metadata: Metadata = {
  title: "Liên hệ | 2S Group",
};

export default function ContactPage() {
  return <ContactPageContent />;
}
