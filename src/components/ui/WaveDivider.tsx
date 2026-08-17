type WaveDividerProps = {
  /** Background of the divider strip — should match the section ABOVE it. */
  topClassName?: string;
  /** Fill of the wave shape — should match the section BELOW it. */
  fill?: string;
  flip?: boolean;
};

export function WaveDivider({ topClassName = "bg-ink", fill = "var(--color-paper)", flip = false }: WaveDividerProps) {
  return (
    <div className={`relative h-14 w-full overflow-hidden sm:h-20 ${topClassName}`} aria-hidden="true">
      <svg
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        className={`absolute inset-0 h-full w-full ${flip ? "rotate-180" : ""}`}
      >
        <path
          d="M0,58 C220,10 420,90 720,56 C1020,22 1230,88 1440,44 L1440,100 L0,100 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}
