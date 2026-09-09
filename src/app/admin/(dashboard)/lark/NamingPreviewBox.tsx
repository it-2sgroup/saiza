import type { NamingSegment } from "@/lib/admin/fileNaming";
import { cardClasses, labelClasses } from "../controls";

export function NamingPreviewBox({ segments }: { segments: NamingSegment[] }) {
  return (
    <div className={`${cardClasses} px-3.5 py-3`}>
      <p className={`${labelClasses} mb-1.5`}>Ví dụ</p>
      <div className="flex flex-wrap items-baseline font-[family-name:var(--font-ibm-plex-mono)] text-[12.5px] leading-[1.7] font-medium">
        {segments.map((s, i) => (
          <span key={i} style={{ color: s.color }}>
            {s.text}
          </span>
        ))}
      </div>
    </div>
  );
}
