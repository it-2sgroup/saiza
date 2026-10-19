import { getCurrentProfile } from "@/lib/supabase/profile";
import { canViewSalesAnalytics } from "@/lib/admin/permissions";
import { createSalesAdminClient } from "@/lib/supabase/salesAdmin";
import { ZENSIP_SHOP_ID } from "@/lib/admin/tiktokOrders";

/**
 * SSE relay báo đơn mới real-time cho trang /admin/don-hang. Chạy ngay trong
 * Next.js server nên trình duyệt KHÔNG cần biết service_role key hay bất kỳ
 * token nào — chỉ cần session cookie đăng nhập (đã tự kiểm tra lại ở đây).
 *
 * Giới hạn thời lượng 1 request của Vercel (kể cả plan trả phí) nên tự đóng
 * kết nối sau MAX_DURATION_MS rồi để EventSource phía client tự reconnect —
 * không cố giữ kết nối mãi mãi.
 */
export const runtime = "nodejs";
export const maxDuration = 55;

const MAX_DURATION_MS = 50_000;
const HEARTBEAT_MS = 20_000;

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!(await canViewSalesAnalytics(profile.role))) {
    return new Response("Forbidden", { status: 403 });
  }

  const dataClient = createSalesAdminClient();

  let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const send = (chunk: string) => {
        try {
          controller.enqueue(enc.encode(chunk));
        } catch {
          // controller đã đóng (client disconnect) — bỏ qua
        }
      };

      send(`retry: 2000\n\n`);
      send(sseEvent("ready", { shop_id: ZENSIP_SHOP_ID, at: new Date().toISOString() }));

      const channel = dataClient
        .channel(`admin-orders-${ZENSIP_SHOP_ID}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "order_events",
            filter: `shop_id=eq.${ZENSIP_SHOP_ID}`,
          },
          (payload) => send(sseEvent("new_order", payload.new)),
        )
        .subscribe();

      heartbeatTimer = setInterval(() => send(`: heartbeat\n\n`), HEARTBEAT_MS);

      const cleanup = () => {
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (closeTimer) clearTimeout(closeTimer);
        dataClient.removeChannel(channel);
        try {
          controller.close();
        } catch {
          // đã đóng rồi — bỏ qua
        }
      };

      closeTimer = setTimeout(() => {
        send(sseEvent("reconnect", { reason: "scheduled_refresh" }));
        cleanup();
      }, MAX_DURATION_MS);

      request.signal?.addEventListener?.("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
