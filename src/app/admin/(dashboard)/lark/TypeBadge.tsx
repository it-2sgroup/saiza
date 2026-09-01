import { LARK_FILE_TYPE_LABELS, type LarkFileType } from "@/lib/lark/fileTypes";

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  folder: { label: "DIR", className: "bg-amber-100 text-amber-700" },
  docx: { label: "DOC", className: "bg-blue-100 text-blue-700" },
  sheet: { label: "XLS", className: "bg-green-100 text-green-700" },
  bitable: { label: "BASE", className: "bg-purple-100 text-purple-700" },
};

export function fileTypeLabel(type: string) {
  return LARK_FILE_TYPE_LABELS[type as LarkFileType] ?? type;
}

export function TypeBadge({ type, size = "md" }: { type: string; size?: "sm" | "md" }) {
  const badge = TYPE_BADGE[type] ?? { label: type.slice(0, 3).toUpperCase(), className: "bg-wash text-ink-2" };
  const sizeClasses = size === "sm" ? "h-7 w-9 text-[10px]" : "h-9 w-9 text-[10px]";
  return (
    <span className={`flex flex-shrink-0 items-center justify-center rounded-md font-bold ${sizeClasses} ${badge.className}`}>
      {badge.label}
    </span>
  );
}
