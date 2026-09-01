import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Used only by the Lark ("Tạo file Lark") page, which follows a distinct
// reference design — declared here (not scoped inside that page) because
// this CSS variable also needs to reach content portaled to document.body
// (modals, dropdowns), which next/font's per-component className can't do.
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Quản trị | SAIZA",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}>
      <body className="admin-theme h-full bg-paper text-ink">{children}</body>
    </html>
  );
}
