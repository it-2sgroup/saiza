"use client";

import { useState } from "react";
import { OrgChartEditor } from "./OrgChartEditor";
import type { ORG_CHARTS, OrgChartData } from "./data";

type ChartEntry = (typeof ORG_CHARTS)[number] & { data: OrgChartData };

// Both charts' data is fetched once, server-side, up front (see page.tsx) —
// switching tabs here just swaps which already-loaded canvas is mounted,
// no refetch. Unmounting the inactive tab (rather than hiding it with CSS)
// keeps two full React Flow instances from both being alive/listening at
// once for no reason.
export function OrgChartTabs({
  charts,
  canEdit,
}: {
  charts: ChartEntry[];
  canEdit: boolean;
}) {
  const [active, setActive] = useState(charts[0]?.key);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {charts.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setActive(c.key)}
            className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              active === c.key
                ? "bg-accent text-white"
                : "border border-line bg-card text-ink-2 hover:border-ink"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      {charts.map((c) =>
        c.key === active ? (
          <OrgChartEditor key={c.key} chartKey={c.key} data={c.data} canEdit={canEdit} />
        ) : null,
      )}
    </div>
  );
}
