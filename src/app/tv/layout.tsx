import type { Metadata } from "next";

// Layout gốc tối thiểu cho /tv — trang này chỉ redirect() ngay lập tức,
// không có nội dung hiển thị, nên không cần import CSS gì (kể cả
// display.css của nhánh /display/*).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function TvRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
