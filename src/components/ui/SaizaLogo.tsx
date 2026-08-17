import Image from "next/image";

type SaizaLogoProps = {
  className?: string;
  tone?: "dark" | "light";
};

const LOGO_ASPECT = 936 / 340;

export function SaizaLogo({ className = "h-7", tone = "dark" }: SaizaLogoProps) {
  const src = tone === "light" ? "/images/brand/saiza-logo-white.png" : "/images/brand/saiza-logo-navy.png";

  return (
    <Image
      src={src}
      alt="SAIZA"
      width={936}
      height={340}
      priority
      style={{ aspectRatio: LOGO_ASPECT }}
      className={`w-auto object-contain ${className}`}
    />
  );
}
