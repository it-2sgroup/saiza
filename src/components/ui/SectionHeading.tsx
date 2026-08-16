type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  tone?: "ink" | "light";
  as?: "h1" | "h2";
  size?: "lg" | "md";
  className?: string;
};

const SIZE_CLASSES = {
  lg: "text-[clamp(34px,4vw,56px)]",
  md: "text-[clamp(30px,3.4vw,44px)]",
} as const;

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  tone = "ink",
  as = "h2",
  size = "lg",
  className = "",
}: SectionHeadingProps) {
  const Heading = as;
  const isCenter = align === "center";
  const eyebrowColor = tone === "light" ? "text-white/55" : "text-accent";
  const subtitleColor = tone === "light" ? "text-white/66" : "text-ink-2";

  return (
    <div
      className={`flex max-w-[620px] flex-col gap-3.5 ${isCenter ? "mx-auto items-center text-center" : ""} ${className}`}
    >
      <span className={`text-xs font-semibold tracking-[0.18em] uppercase ${eyebrowColor}`}>{eyebrow}</span>
      <Heading className={`font-medium leading-[1.06] tracking-[-0.028em] ${SIZE_CLASSES[size]}`}>{title}</Heading>
      {subtitle && <p className={`text-base leading-[1.75] ${subtitleColor}`}>{subtitle}</p>}
    </div>
  );
}
