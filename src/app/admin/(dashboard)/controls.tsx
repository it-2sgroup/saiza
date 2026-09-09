import type { ButtonHTMLAttributes } from "react";

/**
 * The one button in the admin surface.
 *
 * Replaces ~37 hand-written className strings that had drifted apart on every
 * axis at once — radius (`rounded-full`, `rounded-lg`, `rounded-[9px]`,
 * `rounded-[11px]`, `rounded-md`), height (`py-1.5` … `py-3`), type size
 * (`text-xs`, `text-[13px]`, `text-sm`), and weight. That drift is what made
 * the page read as "nút bấm không đồng bộ": no two buttons agreed on what a
 * button looks like, so none of them looked deliberate.
 *
 * Shape follows DESIGN-claude.md's button tokens: 8px radius, 14px/500 label,
 * 40px tall at `md` / 32px at `sm`. Two rules worth keeping when editing this:
 *
 *  - **No motion gimmicks.** The old buttons lifted (`hover:-translate-y-[3px]`)
 *    and shrank on press (`active:scale-[0.97]`). Claude's system encodes
 *    exactly one state change — primary darkens — and nothing else. Bouncing
 *    is what made clicks feel mushy instead of decisive.
 *  - **`ghost` is still a button.** It carries a real hover surface and the
 *    same geometry as the others, so it reads as pressable. It exists so that
 *    secondary actions stop being bare coloured text with an onClick — the
 *    thing the user explicitly called out as "chữ gắn link làm button".
 */

const VARIANTS = {
  // The single primary action on a surface. Never two at once.
  primary:
    "bg-accent text-white hover:bg-accent/90 active:bg-ink disabled:bg-line disabled:text-ink-2",
  // Default for anything that isn't the primary action: visible border, so it
  // reads as a control at rest rather than only on hover.
  secondary:
    "border border-line bg-card text-ink hover:border-ink/25 hover:bg-wash active:bg-wash disabled:text-ink-2",
  // Lowest-emphasis *button* — no border at rest, but a real hover surface and
  // full button geometry. For inline actions inside a card or row.
  ghost:
    "text-ink-2 hover:bg-wash hover:text-ink active:bg-wash disabled:text-ink-2/50",
  // Destructive. Outlined, not filled — a filled red button in a row of
  // neutral ones pulls far more attention than "xoá" deserves.
  danger:
    "border border-red-200 bg-card text-red-600 hover:border-red-300 hover:bg-red-50 active:bg-red-100 disabled:text-red-300",
} as const;

const SIZES = {
  sm: "h-8 gap-1.5 px-3 text-[13px]",
  md: "h-10 gap-2 px-4 text-sm",
  // Square icon-only buttons — same heights, so they line up in a row with
  // labelled buttons of the same size.
  "icon-sm": "h-8 w-8 justify-center",
  "icon-md": "h-10 w-10 justify-center",
} as const;

export type BtnVariant = keyof typeof VARIANTS;
export type BtnSize = keyof typeof SIZES;

const BASE =
  "inline-flex flex-shrink-0 cursor-pointer items-center rounded-lg font-medium whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed";

export function btnClasses(
  variant: BtnVariant = "secondary",
  size: BtnSize = "md",
  className = "",
) {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: BtnVariant;
  size?: BtnSize;
};

export function Btn({
  variant = "secondary",
  size = "md",
  className = "",
  type = "button",
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={btnClasses(variant, size, className)}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * Text inputs, selects and the Combobox trigger. Same 8px radius and 40px
 * height as a `md` Btn, so a field and a button sitting in the same row line
 * up on both axes — they previously didn't, because fieldClasses was
 * redeclared (slightly differently) in three separate files.
 */
export const inputClasses =
  "h-10 w-full rounded-lg border border-line bg-card px-3 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-ink-2/60 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20";

/**
 * Field label. Deliberately sentence case, not the uppercase +
 * letter-spaced treatment used before: uppercase micro-labels above every
 * single field is a big part of why the form read as wall-of-text — they
 * shout at the same volume as the values they describe.
 */
export const labelClasses = "text-[13px] font-medium text-ink-2";

/** Content card. 12px radius per the design system's card tier. */
export const cardClasses = "rounded-xl border border-line bg-card";
