import type { Metadata } from "next";
import { AboutPageContent } from "./AboutPageContent";

export const metadata: Metadata = {
  title: "Về 2S Group | 2S Group",
};

export default function AboutPage() {
  return <AboutPageContent />;
}
