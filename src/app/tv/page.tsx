import { redirect } from "next/navigation";

// Lối tắt ngắn để gõ bằng điều khiển TV — KHÔNG gắn link ở bất kỳ đâu trong
// site (cố ý "giấu kín", chỉ người biết đường dẫn mới vào), chuyển hướng
// sang /display/don-hang kèm sẵn token nên không phải gõ tay cả URL dài.
// Đổi sang redirect() tới trang display khác nếu sau này có thêm màn hình.
//
// force-dynamic: đọc DISPLAY_ORDERS_TOKEN tại thời điểm truy cập, không bake
// cứng lúc build — đổi token trên Vercel có hiệu lực ngay, không cần deploy lại.
export const dynamic = "force-dynamic";

export default function TvShortcutPage() {
  const token = process.env.DISPLAY_ORDERS_TOKEN;
  redirect(`/display/don-hang${token ? `?token=${encodeURIComponent(token)}` : ""}`);
}
