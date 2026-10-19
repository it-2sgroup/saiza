import "server-only";

/**
 * Xác thực nhẹ cho các trang /display/* — màn hình TV/box Android chạy
 * trình duyệt đời cũ, không thể đăng nhập lại qua form mỗi lần mất điện/khởi
 * động lại. Dùng 1 token bí mật trong query string thay cho cookie session,
 * so sánh với DISPLAY_ORDERS_TOKEN đặt trên Vercel — KHÔNG phải cơ chế bảo
 * mật mạnh, chỉ đủ để tránh URL bị đoán ra; không dùng cho dữ liệu nhạy cảm
 * hơn đơn hàng tổng hợp đã hiển thị công khai kiểu dashboard treo tường.
 */
export function isValidDisplayToken(token: string | null | undefined): boolean {
  const expected = process.env.DISPLAY_ORDERS_TOKEN;
  if (!expected) return false;
  return token === expected;
}
