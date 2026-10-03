"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/types";
import type { RuleSection } from "@/lib/content/campaigns";

// Thể lệ là văn bản pháp lý dài — mặc định thu gọn hết để trang không bị đè bẹp
// bởi một bức tường chữ, nhưng vẫn render đầy đủ trong DOM (chỉ ẩn bằng CSS)
// để Ctrl+F của trình duyệt và bot tìm kiếm vẫn thấy toàn bộ nội dung.
export function RulesAccordion({
  sections,
  locale,
  expandAllLabel,
  collapseAllLabel,
}: {
  sections: RuleSection[];
  locale: Locale;
  expandAllLabel: string;
  collapseAllLabel: string;
}) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const allOpen = open.size === sections.length;

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen(allOpen ? new Set() : new Set(sections.map((_, i) => i)))}
          className="cursor-pointer rounded-full border border-line px-4 py-2 text-[13px] font-semibold text-ink-2 transition-colors duration-200 hover:border-accent hover:text-accent"
        >
          {allOpen ? collapseAllLabel : expandAllLabel}
        </button>
      </div>

      <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-card">
        {sections.map((section, i) => {
          const isOpen = open.has(i);
          return (
            <div key={section.numeral}>
              <h3>
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  aria-controls={`rule-panel-${i}`}
                  className="flex w-full cursor-pointer items-center gap-4 px-5 py-5 text-left transition-colors duration-200 hover:bg-wash/60 sm:px-7"
                >
                  <span
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-semibold transition-colors duration-200 ${
                      isOpen ? "bg-accent text-white" : "bg-wash text-accent"
                    }`}
                  >
                    {section.numeral}
                  </span>
                  <span className="flex-1 text-[16.5px] leading-snug font-semibold">
                    {section.heading[locale]}
                  </span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className={`flex-shrink-0 text-ink-2 transition-transform duration-300 ease-soft ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </h3>

              <div
                id={`rule-panel-${i}`}
                hidden={!isOpen}
                className="flex flex-col gap-4 px-5 pt-1 pb-7 pl-[4.25rem] sm:px-7 sm:pl-[5.25rem]"
              >
                {section.blocks.map((block, bi) =>
                  block.kind === "paragraph" ? (
                    <p key={bi} className="text-[15px] leading-[1.85] text-ink-2">
                      {block.text[locale]}
                    </p>
                  ) : (
                    <ul key={bi} className="flex flex-col gap-3">
                      {block.items.map((item, ii) => (
                        <li key={ii} className="flex gap-3 text-[15px] leading-[1.85] text-ink-2">
                          <span
                            aria-hidden="true"
                            className="mt-[0.7em] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-2"
                          />
                          <span>{item[locale]}</span>
                        </li>
                      ))}
                    </ul>
                  ),
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
