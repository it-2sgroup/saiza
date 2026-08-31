"use client";

export function HubCard({
  icon,
  title,
  description,
  onClick,
  accent = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer flex-col items-start gap-3 rounded-card border p-5 text-left transition-all duration-300 ease-soft hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(30,27,75,0.10)] ${
        accent ? "border-accent/30 bg-accent/5 hover:border-accent" : "border-line bg-card hover:border-ink"
      }`}
    >
      <span
        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${
          accent ? "bg-accent text-white" : "bg-wash text-accent-2"
        }`}
      >
        {icon}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="text-[14.5px] font-semibold text-ink">{title}</span>
        <span className="text-xs leading-snug text-ink-2">{description}</span>
      </span>
    </button>
  );
}
