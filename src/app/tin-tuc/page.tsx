import type { Metadata } from "next";
import { NewsPageContent } from "./NewsPageContent";

export const metadata: Metadata = {
  title: "Tin tức | 2S Group",
};

export default function NewsPage() {
  return <NewsPageContent />;
}
