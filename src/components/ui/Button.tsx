import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

const VARIANT_CLASSES = {
  dark: "bg-ink text-white hover:bg-accent",
  light: "bg-white text-ink hover:bg-[oklch(0.86_0.09_160)]",
  outline: "border border-white/45 text-white hover:border-white hover:bg-white/10",
  accent: "bg-accent text-white hover:bg-ink",
} as const;

type Variant = keyof typeof VARIANT_CLASSES;

type CommonProps = {
  variant?: Variant;
  shake?: boolean;
  className?: string;
  children: React.ReactNode;
};

type LinkButtonProps = CommonProps & {
  href: string;
  onClick?: () => void;
};

type ActionButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-full px-7 py-[15px] text-[15px] font-semibold whitespace-nowrap transition-all duration-300 hover:-translate-y-[3px] active:translate-y-0 active:scale-[0.97]";

export function LinkButton({ href, variant = "dark", shake, className = "", children, onClick }: LinkButtonProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${baseClasses} ${VARIANT_CLASSES[variant]} ${
        shake ? "origin-[50%_90%] animate-shake-attn hover:[animation-play-state:paused]" : ""
      } ${className}`}
    >
      {children}
    </Link>
  );
}

export function ActionButton({ variant = "dark", className = "", children, ...props }: ActionButtonProps) {
  return (
    <button className={`${baseClasses} ${VARIANT_CLASSES[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
