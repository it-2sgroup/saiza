import type { NamingSegment } from "@/lib/admin/fileNaming";

export function NamingPreviewBox({ segments }: { segments: NamingSegment[] }) {
  return (
    <div className="rounded-[10px] border border-line bg-card px-3.5 py-3">
      <p className="mb-1.5 text-[10px] font-semibold tracking-[0.08em] text-ink-2 uppercase">Ví dụ tên file</p>
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
