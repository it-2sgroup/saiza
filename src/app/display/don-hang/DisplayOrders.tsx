"use client";

import { useEffect, useRef, useState } from "react";
import type { OrderCounts, OrderListItem } from "@/lib/admin/tiktokOrders";

const POLL_MS = 20_000;
const PAGE_SIZE = 50;

const STATUS_LABEL_VI: Record<string, string> = {
  UNPAID: "Chưa thanh toán",
  AWAITING_SHIPMENT: "Chờ chuẩn bị hàng",
  AWAITING_COLLECTION: "Cần gửi",
  IN_TRANSIT: "Đang vận chuyển",
  DELIVERED: "Đã giao",
  COMPLETED: "Đã hoàn tất",
  CANCELLED: "Đã hủy",
};

function statusLabel(status: string | null): string {
  if (!status) return "—";
  const label = STATUS_LABEL_VI[status.toUpperCase()] ?? status;
  return label.toLocaleUpperCase("vi");
}

function statusBadgeClass(status: string | null): string {
  const s = (status ?? "").toUpperCase();
  if (s === "AWAITING_COLLECTION" || s === "AWAITING_SHIPMENT" || s === "UNPAID") return "dpo-badge dpo-badge-awaiting";
  if (s === "IN_TRANSIT") return "dpo-badge dpo-badge-transit";
  if (s === "DELIVERED" || s === "COMPLETED") return "dpo-badge dpo-badge-delivered";
  if (s === "CANCELLED") return "dpo-badge dpo-badge-cancelled";
  return "dpo-badge dpo-badge-neutral";
}

function productSummary(items: { product_name: string | null; sku_name: string | null }[]): string {
  if (!items || items.length === 0) return "—";
  const first = items[0].product_name || items[0].sku_name || "Sản phẩm";
  const extra = items.length > 1 ? ` +${items.length - 1} khác` : "";
  return first + extra;
}

function fmtAmount(amount: number | null, currency: string | null): string {
  if (amount == null) return "—";
  return `${Number(amount).toLocaleString("vi-VN")} ${currency ?? ""}`.trim();
}

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function DisplayOrders({
  initialStats,
  initialOrders,
  token,
}: {
  initialStats: OrderCounts;
  initialOrders: OrderListItem[];
  token: string;
}) {
  const [stats, setStats] = useState(initialStats);
  const [orders, setOrders] = useState(initialOrders);
  const [connStatus, setConnStatus] = useState<"connecting" | "ok" | "err">("connecting");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const prevIdsRef = useRef<Set<string>>(new Set(initialOrders.map((o) => o.tiktok_order_id)));

  // Poll định kỳ bằng fetch thuần — KHÔNG dùng EventSource/WebSocket, vì
  // trình duyệt TV đời cũ có thể không hỗ trợ ổn định, và màn hình này chạy
  // nền vô thời hạn nên ưu tiên độ bền hơn độ trễ.
  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const res = await fetch(`/api/display/don-hang?token=${encodeURIComponent(token)}&limit=${PAGE_SIZE}`);
        const json = await res.json();
        if (cancelled || !res.ok || !json.ok) {
          if (!cancelled) setConnStatus("err");
          return;
        }
        const nextOrders = json.orders as OrderListItem[];
        const prevIds = prevIdsRef.current;
        const freshIds = new Set(
          nextOrders.filter((o) => !prevIds.has(o.tiktok_order_id)).map((o) => o.tiktok_order_id),
        );
        prevIdsRef.current = new Set(nextOrders.map((o) => o.tiktok_order_id));

        setStats(json.stats);
        setOrders(nextOrders);
        setConnStatus("ok");
        setUpdatedAt(new Date(json.servedAt ?? Date.now()).toLocaleTimeString("vi-VN"));

        if (freshIds.size > 0) {
          setFlashIds(freshIds);
          setTimeout(() => setFlashIds(new Set()), 1600);
        }
      } catch {
        if (!cancelled) setConnStatus("err");
      }
    }

    tick();
    const poll = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [token]);

  return (
    <div className="dpo-page">
      <div className="dpo-header">
        <h1 className="dpo-title">Đơn hàng ZENSIP</h1>
        <p className="dpo-subtitle">TikTok Shop — số liệu thật, đồng bộ trực tiếp từ hệ thống SOVA</p>
      </div>

      <div className="dpo-status-row">
        <span className={`dpo-dot ${connStatus === "ok" ? "dpo-dot-ok" : connStatus === "err" ? "dpo-dot-err" : ""}`} />
        {connStatus === "ok"
          ? `Đã cập nhật lúc ${updatedAt ?? "—"} · tự làm mới mỗi ${POLL_MS / 1000}s`
          : connStatus === "err"
            ? "Mất kết nối — đang tự thử lại"
            : "Đang tải…"}
      </div>

      <ul className="dpo-stats">
        <li className="dpo-stats-item">
          <div className="dpo-stat-card">
            <p className="dpo-stat-label">Cần gửi</p>
            <p className="dpo-stat-value">{Math.round(stats.awaiting_collection).toLocaleString("vi-VN")}</p>
          </div>
        </li>
        <li className="dpo-stats-item">
          <div className="dpo-stat-card">
            <p className="dpo-stat-label">Đang vận chuyển</p>
            <p className="dpo-stat-value">{Math.round(stats.in_transit).toLocaleString("vi-VN")}</p>
          </div>
        </li>
        <li className="dpo-stats-item">
          <div className="dpo-stat-card">
            <p className="dpo-stat-label">Đã hoàn tất</p>
            <p className="dpo-stat-value">{Math.round(stats.delivered).toLocaleString("vi-VN")}</p>
          </div>
        </li>
        <li className="dpo-stats-item">
          <div className="dpo-stat-card">
            <p className="dpo-stat-label">Đã hủy</p>
            <p className="dpo-stat-value">{Math.round(stats.cancelled).toLocaleString("vi-VN")}</p>
          </div>
        </li>
        <li className="dpo-stats-item">
          <div className="dpo-stat-card">
            <p className="dpo-stat-label">Tổng đơn (từ trước đến nay)</p>
            <p className="dpo-stat-value">{Math.round(stats.total).toLocaleString("vi-VN")}</p>
          </div>
        </li>
      </ul>

      <h2 className="dpo-section-title">Lịch sử đơn hàng (từ trước đến nay)</h2>

      {orders.length === 0 ? (
        <p className="dpo-empty">Chưa có đơn nào.</p>
      ) : (
        <div>
          {orders.map((o) => {
            const justArrived = flashIds.has(o.tiktok_order_id);
            const showNewTag = justArrived || isToday(o.created_at_tiktok);
            const isCancelled = (o.status ?? "").toUpperCase() === "CANCELLED";
            return (
              <div key={o.tiktok_order_id} className={`dpo-order-row ${justArrived ? "dpo-flash" : ""}`}>
                <span className="dpo-tag-cell">
                  {showNewTag && (
                    <span className={`dpo-tag-new ${isCancelled ? "dpo-tag-cancelled" : ""}`}>
                      {isCancelled ? "Đơn bị hủy" : "Đơn mới"}
                    </span>
                  )}
                </span>
                <span className="dpo-order-id" title={`#${o.tiktok_order_id}`}>
                  #{o.tiktok_order_id}
                </span>
                <span className="dpo-order-product" title={productSummary(o.line_items)}>
                  {productSummary(o.line_items)}
                </span>
                <span className="dpo-status-cell">
                  <span className={statusBadgeClass(o.status)}>{statusLabel(o.status)}</span>
                </span>
                <span className="dpo-order-amount">{fmtAmount(o.total_amount, o.currency)}</span>
                <span className="dpo-order-time">
                  {o.created_at_tiktok ? new Date(o.created_at_tiktok).toLocaleString("vi-VN") : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
