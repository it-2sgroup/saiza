import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingContact } from "@/components/layout/FloatingContact";
import { BackToTop } from "@/components/layout/BackToTop";
import { BottomCta } from "@/components/shared/BottomCta";
import { WaveDivider } from "@/components/ui/WaveDivider";
import { vi } from "@/lib/i18n/vi";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: vi.meta.title,
  description: vi.meta.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <LanguageProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <BottomCta />
          <WaveDivider topClassName="bg-wash" fill="var(--color-ink)" />
          <Footer />
          <FloatingContact />
          <BackToTop />
        </LanguageProvider>
      </body>
    </html>
  );
}
