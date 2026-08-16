type MarqueeToggleProps = {
  paused: boolean;
  onToggle: () => void;
  pauseLabel: string;
  playLabel: string;
};

export function MarqueeToggle({ paused, onToggle, pauseLabel, playLabel }: MarqueeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={paused ? playLabel : pauseLabel}
      aria-pressed={paused}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:border-ink hover:text-ink"
    >
      {paused ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
        </svg>
      )}
    </button>
  );
}
