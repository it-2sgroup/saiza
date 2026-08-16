import type { Metadata } from "next";
import { NewsPageContent } from "./NewsPageContent";

export const metadata: Metadata = {
  title: "Tin tức | SAIZA",
};

export default function NewsPage() {
  return <NewsPageContent />;
}
