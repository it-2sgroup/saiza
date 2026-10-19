import type { Metadata } from "next";
import "./display.css";

/**
 * Root layout RIÊNG cho nhánh /display/* — CỐ Ý không import globals.css
 * (Tailwind v4). Tailwind v4 sinh CSS dùng cú pháp hiện đại (@theme, cascade
 * layers, oklch...) mà trình duyệt tích hợp sẵn trên TV/box Android đời cũ
 * không parse được, khiến cả trang mất style hoàn toàn. Nhánh này tồn tại
 * để hiển thị dashboard treo tường trên đúng loại trình duyệt đó, nên style
 * ở đây viết tay bằng CSS thuần (display.css) — không có Tailwind, không
 * custom property hiện đại, không nesting.
 */
export const metadata: Metadata = {
  title: "Màn hình hiển thị | SAIZA",
  robots: { index: false, follow: false },
};

export default function DisplayRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
