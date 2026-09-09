import { cardClasses } from "./controls";

export function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className={`${cardClasses} p-4`}>
      <div className="text-2xl font-semibold text-ink">{value}</div>
      <div className="text-[13px] text-ink-2">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-2/70">{sub}</div>}
    </div>
  );
}
