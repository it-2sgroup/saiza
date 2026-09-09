"use client";

import { Btn } from "./controls";

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-shrink-0 items-center justify-between gap-3 pt-1">
      <span className="text-[13px] text-ink-2">
        {page}/{totalPages}
      </span>
      <div className="flex items-center gap-1.5">
        <Btn
          size="icon-sm"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Trang trước"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Btn>
        <Btn
          size="icon-sm"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Trang sau"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Btn>
      </div>
    </div>
  );
}
