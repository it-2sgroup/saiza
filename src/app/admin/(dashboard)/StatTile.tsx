export function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-card border border-line bg-paper p-4">
      <div className="text-2xl font-semibold text-ink">{value}</div>
      <div className="text-xs text-ink-2">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-ink-2/70">{sub}</div>}
    </div>
  );
}
