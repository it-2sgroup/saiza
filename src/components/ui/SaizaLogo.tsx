type SaizaLogoProps = {
  className?: string;
  tone?: "dark" | "light";
};

export function SaizaLogo({ className = "", tone = "dark" }: SaizaLogoProps) {
  const gradient = tone === "light" ? "from-white to-[#9FB8E8]" : "from-accent to-ink";

  return (
    <span
      className={`bg-gradient-to-br ${gradient} bg-clip-text font-extrabold tracking-tight text-transparent italic ${className}`}
    >
      SAIZA
    </span>
  );
}
