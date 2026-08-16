import type { Metadata } from "next";
import { AboutPageContent } from "./AboutPageContent";

export const metadata: Metadata = {
  title: "Về SAIZA | SAIZA",
};

export default function AboutPage() {
  return <AboutPageContent />;
}
