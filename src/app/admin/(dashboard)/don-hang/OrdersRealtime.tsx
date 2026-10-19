"use client";

import { useEffect, useRef, useState } from "react";
import { btnClasses } from "../controls";
import type { OrderCounts, OrderListItem } from "@/lib/admin/tiktokOrders";

const POLL_MS = 30_000;
const TOAST_LIFETIME_MS = 30_000;
const PAGE_SIZE = 50;

type ToastOrder = {
  tiktok_order_id: string | number;
  status: string | null;
  total_amount: number | null;
  currency: string | null;
  received_at?: string;
  line_items?: { product_name?: string | null; sku_name?: string | null }[];
  is_new_order?: boolean;
  alert_reason?: "new_order" | "cancelled" | null;
};

type AlertTone = "new_order" | "cancelled";

function statusBadgeClasses(status: string | null): string {
  const s = (status ?? "").toUpperCase();
  if (s === "AWAITING_COLLECTION" || s === "AWAITING_SHIPMENT" || s === "UNPAID")
    return "bg-amber-50 text-amber-700";
  if (s === "IN_TRANSIT") return "bg-wash text-accent";
  if (s === "DELIVERED" || s === "COMPLETED") return "bg-emerald-50 text-emerald-700";
  if (s === "CANCELLED") return "bg-red-50 text-red-600";
  return "bg-wash text-ink-2";
}

const STATUS_LABEL_VI: Record<string, string> = {
  UNPAID: "Chưa thanh toán",
  AWAITING_SHIPMENT: "Chờ chuẩn bị hàng",
  AWAITING_COLLECTION: "Cần gửi",
  IN_TRANSIT: "Đang vận chuyển",
  DELIVERED: "Đã giao",
  COMPLETED: "Đã hoàn tất",
  CANCELLED: "Đã hủy",
};

/** Dịch sang tiếng Việt để hiển thị — trạng thái lạ chưa gặp thì giữ nguyên
 * chuỗi gốc thay vì ẩn đi, để không mất thông tin khi TikTok thêm trạng thái mới. */
function statusLabel(status: string | null): string {
  if (!status) return "—";
  const label = STATUS_LABEL_VI[status.toUpperCase()] ?? status;
  return label.toLocaleUpperCase("vi");
}

function productSummary(items?: { product_name?: string | null; sku_name?: string | null }[]): string {
  if (!items || items.length === 0) return "—";
  const first = items[0].product_name || items[0].sku_name || "Sản phẩm";
  const extra = items.length > 1 ? ` +${items.length - 1} khác` : "";
  return first + extra;
}

function fmtAmount(amount: number | null, currency: string | null): string {
  if (amount == null) return "—";
  return `${Number(amount).toLocaleString("vi-VN")} ${currency ?? ""}`.trim();
}

/** Thẻ tag treo kiểu nhãn giá sản phẩm, gắn lệch góc trên-phải card.
 * Vàng "Đơn mới" cho đơn thật sự mới, đỏ "Đơn bị hủy" khi đơn vừa chuyển
 * sang CANCELLED — 2 trường hợp duy nhất được phép "báo ồn". */
function NewOrderTag({ tone = "new_order", className = "" }: { tone?: AlertTone; className?: string }) {
  const isCancel = tone === "cancelled";
  const label = isCancel ? "Đơn bị hủy" : "Đơn mới";
  const gradId = isCancel ? "saizaTagGradCancel" : "saizaTagGradNew";
  const stroke = isCancel ? "#a52a2a" : "#c6870a";
  const textColor = isCancel ? "#5c0a0a" : "#6b4600";
  return (
    <div
      className={`pointer-events-none absolute -right-2 -top-2 z-10 rotate-[14deg] scale-[0.67] origin-top-right drop-shadow-md ${className}`}
      aria-hidden
    >
      <svg width="100" height="44" viewBox="0 0 100 44">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isCancel ? "#ffb4b4" : "#ffe28a"} />
            <stop offset="100%" stopColor={isCancel ? "#e5484d" : "#f5ab00"} />
          </linearGradient>
        </defs>
        <path
          d="M8 2h56l32 20-32 20H8a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6Z"
          fill={`url(#${gradId})`}
          stroke={stroke}
          strokeWidth="1.5"
        />
        <circle cx="78" cy="22" r="4.5" fill="#fffaf0" stroke={stroke} strokeWidth="1.5" />
        <text x="36" y="27" textAnchor="middle" fontSize="13" fontWeight="800" fill={textColor}>
          {label}
        </text>
      </svg>
    </div>
  );
}

/** Đơn tạo trong ngày hôm nay (theo giờ máy đang xem trang) — dùng để gắn
 * tag "Đơn mới" thường trực, không giới hạn cứng mấy dòng đầu. */
function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function toOrderListItem(o: ToastOrder): OrderListItem {
  return {
    tiktok_order_id: String(o.tiktok_order_id ?? "?"),
    status: o.status ?? null,
    total_amount: o.total_amount ?? null,
    currency: o.currency ?? null,
    created_at_tiktok: o.received_at ?? null,
    line_items: (o.line_items ?? []).map((li) => ({
      product_name: li.product_name ?? null,
      sku_name: li.sku_name ?? null,
    })),
  };
}

function StatBlock({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-line bg-card p-5">
      <div className="flex items-center gap-1.5">
        {accent && <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: accent }} />}
        <p className="truncate text-[13px] font-medium text-ink-2">{label}</p>
      </div>
      <p className="mt-2 text-[34px] leading-none font-semibold tracking-[-0.02em] text-ink">{value}</p>
    </div>
  );
}

export function OrdersRealtime({
  initialStats,
  initialOrders,
}: {
  initialStats: OrderCounts;
  initialOrders: OrderListItem[];
}) {
  const [stats, setStats] = useState(initialStats);
  const [orders, setOrders] = useState(initialOrders);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [hasMore, setHasMore] = useState(initialOrders.length >= PAGE_SIZE);
  const [connStatus, setConnStatus] = useState<"connecting" | "ok" | "err">("connecting");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; order: ToastOrder; reason: AlertTone; show: boolean }[]>([]);
  const [insertedTags, setInsertedTags] = useState<Map<string, AlertTone>>(new Map());
  const [jumpKey, setJumpKey] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundEnabledRef = useRef(false);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Theo dõi trạng thái fullscreen qua sự kiện của trình duyệt (không chỉ dựa
  // vào biến nội bộ) — người dùng có thể thoát bằng phím Esc, không chỉ bằng
  // nút bấm, lúc đó vẫn cần cập nhật lại icon/nhãn cho đúng.
  useEffect(() => {
    const handler = () => setIsFullscreen(document.fullscreenElement === fullscreenRef.current);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      fullscreenRef.current?.requestFullscreen();
    }
  }

  function playTing() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.45);
    });
  }

  function enableSound() {
    if (soundEnabledRef.current) return;
    if (!audioCtxRef.current) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new Ctor();
    }
    audioCtxRef.current.resume();
    if (!voiceRef.current) {
      voiceRef.current = new Audio("/sounds/new-order-voice.mp3");
      voiceRef.current.preload = "auto";
    }
    soundEnabledRef.current = true;
    setSoundEnabled(true);
    if (window.Notification && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }

  /** Ting báo trước — giọng đọc chỉ phát tiếp theo khi là đơn MỚI thật sự
   * (giọng thu sẵn nói về đơn mới, phát cho cả lúc hủy đơn sẽ sai ngữ cảnh). */
  function playAlertSound(reason: AlertTone) {
    playTing();
    if (reason !== "new_order") return;
    setTimeout(() => {
      const voice = voiceRef.current;
      if (!voice) return;
      voice.currentTime = 0;
      voice.play().catch(() => {
        // Trình duyệt chặn phát (hiếm khi xảy ra vì đã có gesture mở âm
        // thanh trước đó) — bỏ qua, không làm vỡ luồng xử lý đơn mới.
      });
    }, 600);
  }

  // Trình duyệt chặn phát âm thanh tự động tới khi có 1 cú bấm/chạm bất kỳ —
  // không lách bằng code được (chính sách autoplay), nên tự bật ở lần tương
  // tác ĐẦU TIÊN trên trang, không bắt buộc đúng 1 nút cụ thể.
  useEffect(() => {
    const handler = () => enableSound();
    document.addEventListener("pointerdown", handler, { once: true });
    document.addEventListener("keydown", handler, { once: true });
    return () => {
      document.removeEventListener("pointerdown", handler);
      document.removeEventListener("keydown", handler);
    };
  }, []);

  async function refreshStats() {
    try {
      const res = await fetch(`/api/admin/orders?limit=${limit}`);
      const json = await res.json();
      if (!res.ok || !json.ok) return;
      setStats(json.stats);
      setOrders(json.orders);
      setHasMore(json.orders.length >= limit);
    } catch {
      // bỏ qua, poll tiếp theo thử lại
    }
  }

  // refreshStats đổi tham chiếu mỗi lần render (đóng gói `limit` hiện tại),
  // nhưng effect mở EventSource chỉ chạy 1 lần lúc mount (deps rỗng) — nếu
  // gọi thẳng `refreshStats` trong đó sẽ bị "đóng băng" mãi mãi giá trị
  // `limit` lúc mount, sai sau khi bấm "Tải thêm". Dùng ref để luôn gọi
  // đúng bản mới nhất.
  const refreshStatsRef = useRef(refreshStats);
  useEffect(() => {
    refreshStatsRef.current = refreshStats;
  });

  /** Cập nhật tag trạng thái tại chỗ — dùng cho các lần đổi trạng thái
   * KHÔNG phải "đơn mới"/"vừa hủy". Nếu đơn chưa nằm trong trang hiện tại
   * (ngoài giới hạn limit) thì bỏ qua, để refreshStats()/poll tự đồng bộ sau. */
  function applyStatusUpdate(order: ToastOrder) {
    const item = toOrderListItem(order);
    setOrders((prev) => {
      const idx = prev.findIndex((o) => o.tiktok_order_id === item.tiktok_order_id);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = item;
      return next;
    });
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, show: false } : t)));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300);
  }

  function showToast(order: ToastOrder, reason: AlertTone) {
    const id = `${order.tiktok_order_id}-${Date.now()}`;
    setToasts((prev) => [...prev.slice(-3), { id, order, reason, show: false }]);
    // setTimeout thay vì requestAnimationFrame — rAF bị trình duyệt tạm dừng
    // khi tab chạy nền, mà trang này đúng là để mở nền cả ngày.
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, show: true } : t)));
    }, 20);
    setTimeout(() => removeToast(id), TOAST_LIFETIME_MS);
  }

  /** Chèn lên đầu + gắn tag + hiệu ứng (đơn mới / vừa hủy). Các lần đổi
   * trạng thái khác KHÔNG gọi hàm này — chỉ refreshStats() lo cập nhật âm
   * thầm. */
  function insertHistoryItem(order: ToastOrder, reason: AlertTone) {
    const item = toOrderListItem(order);
    setOrders((prev) => [item, ...prev.filter((o) => o.tiktok_order_id !== item.tiktok_order_id)].slice(0, Math.max(limit, PAGE_SIZE)));
    setInsertedTags((prev) => new Map(prev).set(item.tiktok_order_id, reason));
    setTimeout(() => {
      setInsertedTags((prev) => {
        const next = new Map(prev);
        next.delete(item.tiktok_order_id);
        return next;
      });
    }, 1500);
  }

  useEffect(() => {
    const es = new EventSource("/api/admin/orders-stream");

    es.addEventListener("ready", () => setConnStatus("ok"));

    es.addEventListener("new_order", (ev: MessageEvent) => {
      try {
        const order = JSON.parse(ev.data) as ToastOrder;

        // TikTok gửi webhook cho MỌI lần đổi trạng thái (kể cả gửi lặp),
        // không riêng lúc có đơn mới — is_new_order/alert_reason đã tính
        // sẵn phía nguồn để lọc, tránh "Đơn mới" giả cho đơn cũ chỉ đổi
        // trạng thái (vd DELIVERED → COMPLETED).
        const reason: AlertTone | null = order.is_new_order
          ? "new_order"
          : order.alert_reason === "cancelled"
            ? "cancelled"
            : null;

        if (reason) {
          showToast(order, reason);
          insertHistoryItem(order, reason);
          setJumpKey((k) => k + 1);
          if (soundEnabledRef.current) playAlertSound(reason);
          if (window.Notification && Notification.permission === "granted") {
            new Notification(reason === "cancelled" ? "Đơn bị hủy trên TikTok Shop" : "Đơn mới trên TikTok Shop", {
              body: `#${order.tiktok_order_id} — ${statusLabel(order.status)}`,
            });
          }
        } else {
          applyStatusUpdate(order);
        }
        refreshStatsRef.current();
      } catch {
        // bỏ qua event lỗi định dạng
      }
    });

    es.onerror = () => setConnStatus("err");

    const poll = setInterval(() => refreshStatsRef.current(), POLL_MS);
    return () => {
      es.close();
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMore() {
    const nextLimit = limit + PAGE_SIZE;
    setLimit(nextLimit);
    try {
      const res = await fetch(`/api/admin/orders?limit=${nextLimit}`);
      const json = await res.json();
      if (!res.ok || !json.ok) return;
      setOrders(json.orders);
      setHasMore(json.orders.length >= nextLimit);
    } catch {
      // bỏ qua
    }
  }

  return (
    <div ref={fullscreenRef} className="bg-paper">
      <div className="mb-2 flex items-center gap-2 text-[12.5px] text-ink-2">
        <span
          aria-hidden
          className={`h-2 w-2 rounded-full ${
            connStatus === "ok" ? "bg-emerald-500" : connStatus === "err" ? "bg-red-500" : "bg-ink-2"
          }`}
        />
        {connStatus === "ok" ? "Đã kết nối real-time" : connStatus === "err" ? "Mất kết nối — đang tự thử lại" : "Đang kết nối…"}
        <button type="button" onClick={toggleFullscreen} className={btnClasses("secondary", "sm", "ml-auto")}>
          {isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
        </button>
        {!soundEnabled && <span>· Bấm vào trang để bật âm thanh báo đơn</span>}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatBlock label="Cần gửi" value={Math.round(stats.awaiting_collection).toLocaleString("vi-VN")} accent="#d97706" />
        <StatBlock label="Đang vận chuyển" value={Math.round(stats.in_transit).toLocaleString("vi-VN")} accent="var(--color-accent)" />
        <StatBlock label="Đã hoàn tất" value={Math.round(stats.delivered).toLocaleString("vi-VN")} accent="#059669" />
        <StatBlock label="Đã hủy" value={Math.round(stats.cancelled).toLocaleString("vi-VN")} accent="#dc2626" />
        <StatBlock label="Tổng đơn (từ trước đến nay)" value={Math.round(stats.total).toLocaleString("vi-VN")} />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-ink-2">Lịch sử đơn hàng (từ trước đến nay)</h2>

      {orders.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-2">Chưa có đơn nào.</p>
      ) : (
        <div className="space-y-2.5">
          {orders.map((o) => {
            // Tag hiện tạm (1.5s) khi webhook vừa báo — nhưng đơn tạo trong
            // NGÀY HÔM NAY luôn gắn tag thường trực kiểu "Đơn mới".
            const transientTone = insertedTags.get(o.tiktok_order_id);
            const tagTone: AlertTone | undefined = transientTone ?? (isToday(o.created_at_tiktok) ? "new_order" : undefined);
            return (
              <div
                key={o.tiktok_order_id}
                className="relative flex flex-wrap items-center gap-3 rounded-xl border border-line bg-card p-3.5 sm:gap-4"
                style={
                  transientTone
                    ? { animation: "saiza-slide-in-top 400ms cubic-bezier(0.32,0.72,0,1) both" }
                    : undefined
                }
              >
                {tagTone && <NewOrderTag tone={tagTone} />}
                <span className="min-w-[130px] text-[13.5px] font-semibold text-ink">#{o.tiktok_order_id}</span>
                <span className="min-w-[200px] flex-1 text-[13.5px] text-ink-2">{productSummary(o.line_items)}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-[3px] text-[11.5px] font-medium ${statusBadgeClasses(o.status)}`}>
                  {statusLabel(o.status)}
                </span>
                <span className="ml-auto min-w-[100px] text-right text-[13.5px] font-semibold text-emerald-700">
                  {fmtAmount(o.total_amount, o.currency)}
                </span>
                <span className="min-w-[130px] text-right text-xs text-ink-2">
                  {o.created_at_tiktok ? new Date(o.created_at_tiktok).toLocaleString("vi-VN") : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {hasMore && (
        <div className="mt-4 text-center">
          <button type="button" onClick={loadMore} className={btnClasses("secondary", "md")}>
            Tải thêm
          </button>
        </div>
      )}

      <div className="h-20" aria-hidden />

      {/* Nhân vật "hộp hàng" — nhảy mỗi khi có đơn mới real-time. */}
      <div className="pointer-events-none fixed bottom-5 left-5 z-40" aria-hidden>
        <div
          key={jumpKey}
          className="grid h-16 w-16 place-items-center rounded-full bg-card shadow-[0_6px_20px_rgba(0,0,0,0.25)] ring-1 ring-line"
          style={jumpKey > 0 ? { animation: "saiza-mascot-jump 700ms cubic-bezier(.34,1.56,.64,1) both" } : undefined}
        >
          <svg width="44" height="44" viewBox="0 0 56 56" fill="none">
            <rect x="8" y="22" width="40" height="28" rx="4" fill="var(--color-accent)" />
            <path d="M8 26 L28 34 L48 26" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinejoin="round" fill="none" />
            <path d="M28 34 L28 50" stroke="var(--color-ink)" strokeWidth="2.5" />
            <path d="M20 22c0-6 5-11 8-11s8 5 8 11" stroke="#d97706" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <circle cx="21" cy="38" r="2.2" fill="white" />
            <circle cx="35" cy="38" r="2.2" fill="white" />
            <path d="M22 44c2 2 10 2 12 0" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-[min(380px,calc(100vw-40px))] flex-col-reverse gap-3">
        {toasts.map(({ id, order, reason, show }) => (
          <div
            key={id}
            className={`pointer-events-auto relative rounded-2xl border bg-card p-4 shadow-[0_12px_32px_rgba(0,0,0,0.25)] transition-all duration-300 ${
              reason === "cancelled" ? "border-red-400" : "border-accent"
            }`}
            style={{ opacity: show ? 1 : 0, transform: show ? "none" : "translateY(40%) scale(0.96)" }}
          >
            <NewOrderTag tone={reason} />
            <button type="button" onClick={() => removeToast(id)} aria-label="Đóng" className="absolute left-2.5 top-2 text-ink-2">
              ✕
            </button>
            <div className="flex items-center justify-between gap-3 pl-5">
              <span className="text-lg font-bold text-emerald-700">{fmtAmount(order.total_amount, order.currency)}</span>
            </div>
            <p className="mt-1.5 text-[12.5px] text-ink-2">
              Đơn #{order.tiktok_order_id} · {statusLabel(order.status)}
            </p>
            {order.line_items && order.line_items.length > 0 && (
              <p className="mt-2 text-[13.5px] text-ink-2">🛒 {productSummary(order.line_items)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
