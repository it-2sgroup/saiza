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
import { getLogoUrls } from "@/lib/content/site-images";
import { getDictionary } from "@/lib/content/site-text";
import { getSiteConfig } from "@/lib/content/site-config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: vi.meta.title,
  description: vi.meta.description,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [logos, dictVi, dictEn, config] = await Promise.all([
    getLogoUrls(),
    getDictionary("vi"),
    getDictionary("en"),
    getSiteConfig(),
  ]);

  return (
    <html lang="vi" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <LanguageProvider dictionaries={{ vi: dictVi, en: dictEn }}>
          <Header logoSrc={logos.dark} phone={config.phone} />
          <main className="flex-1">{children}</main>
          <BottomCta />
          <WaveDivider topClassName="bg-wash" fill="var(--color-ink)" />
          <Footer
            logoSrc={logos.light}
            phone={config.phone}
            email={config.email}
            office1Address={config.office1Address}
            office2Address={config.office2Address}
            facebookUrl={config.facebookUrl}
            zaloUrl={config.zaloUrl}
            tiktokUrl={config.tiktokUrl}
          />
          <FloatingContact />
          <BackToTop />
        </LanguageProvider>
      </body>
    </html>
  );
}
