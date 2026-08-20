"use client";

import { useMemo, useState } from "react";
import { TextGroupEditor, type TextGroupField } from "./TextGroupEditor";

export type TextGroup = {
  groupKey: string;
  groupLabel: string;
  fields: TextGroupField[];
  isOverridden: boolean;
};

export function TextGroupsList({ groups }: { groups: TextGroup[] }) {
  const [query, setQuery] = useState("");

  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((group) => {
        const groupMatches = group.groupLabel.toLowerCase().includes(q);
        const fields = groupMatches
          ? group.fields
          : group.fields.filter(
              (f) => f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q),
            );
        return fields.length > 0 ? { ...group, fields } : null;
      })
      .filter((g): g is TextGroup => g !== null);
  }, [groups, query]);

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tìm theo tên mục hoặc khoá..."
        className="w-full max-w-[420px] rounded-full border border-line bg-card px-4 py-2.5 text-sm outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
      />
      <div className="flex flex-col gap-3">
        {visibleGroups.length === 0 && <p className="text-ink-2">Không tìm thấy mục nào khớp.</p>}
        {visibleGroups.map((group) => (
          <TextGroupEditor
            key={group.groupKey}
            groupKey={group.groupKey}
            groupLabel={group.groupLabel}
            fields={group.fields}
            isOverridden={group.isOverridden}
            defaultOpen={query.trim().length > 0}
          />
        ))}
      </div>
    </div>
  );
}
