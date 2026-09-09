const STATUS_BADGE = {
  active: { label: "Đang sử dụng", className: "bg-green-100 text-green-700" },
  trashed: {
    label: "Đã xóa · khôi phục được",
    className: "bg-amber-100 text-amber-700",
  },
} as const;

export type FileStatus = keyof typeof STATUS_BADGE;

// A permanently-purged file has no badge because it has no row: data.ts
// excludes it from every list (see hiddenIds in getLarkPageData), so "active"
// vs "trashed" are the only two states this app's UI ever needs to show.
export function StatusBadge({ status }: { status: FileStatus }) {
  const badge = STATUS_BADGE[status];
  return (
    <span
      className={`flex-shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}
