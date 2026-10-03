import type { NextConfig } from "next";

const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Only takes effect when actually served over HTTPS — harmless locally.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Avatar uploads are capped at 2MB in the app; leave headroom for
      // multipart/form-data boundary overhead on top of that.
      bodySizeLimit: "3mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "2sgroup.vn",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "zkxlyuuicmynshkjdllj.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        // URL ngắn để in mã QR lên thẻ cào / bao bì. QR mã hoá chuỗi càng ngắn
        // thì lưới càng ít ô, in cỡ nhỏ vẫn quét được:
        //   /the-le                                → 23 ký tự, lưới 29×29
        //   /hoat-dong/cao-nhanh-tay-trung-ngay-500k → 55 ký tự, lưới 41×41
        // permanent: false (307) là cố ý — mã QR đã in ra giấy thì không sửa
        // được nữa, nên khi đổi sang chương trình khác ta chỉ cần trỏ lại
        // destination ở đây. Dùng 308 thì trình duyệt cache vĩnh viễn và
        // những người đã quét một lần sẽ mắc kẹt ở chương trình cũ.
        source: "/the-le",
        destination: "/hoat-dong/cao-nhanh-tay-trung-ngay-500k",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        // Belt-and-suspenders alongside the `robots` metadata already set on
        // the admin root layout — keeps the staff area out of search indexes
        // even if the metadata tag is ever missed on a new admin page.
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
