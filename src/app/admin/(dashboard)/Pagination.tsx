"use client";

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-shrink-0 items-center justify-between gap-3 pt-1">
      <span className="text-xs text-ink-2">
        Trang {page}/{totalPages}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="cursor-pointer rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Trước
        </button>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="cursor-pointer rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau →
        </button>
      </div>
    </div>
  );
}
