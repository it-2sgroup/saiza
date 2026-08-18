"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { MarqueeToggle } from "@/components/ui/MarqueeToggle";
import { kolList } from "@/lib/data/kol";

const MS_PER_STEP = 3200;
const CARD_SPACING_PX = 210;
const CARD_ROTATE_DEG = 30;
const CARD_SCALE_STEP = 0.14;
const ARC_LIFT_PX = 56;
const CAPTION_FADE_RANGE = 0.55;
// How much of the outer travel range fades the card out before it reaches the
// wrap-around seam, so the pixel-position teleport at the seam happens while
// invisible instead of as a visible jump.
const EDGE_FADE_RANGE = 1;

function continuousOffset(index: number, phase: number, length: number) {
  let offset = index - phase;
  offset = (((offset + length / 2) % length) + length) % length - length / 2;
  return offset;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function ArrowButton({ direction, onClick, label }: { direction: "prev" | "next"; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-line text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {direction === "prev" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  );
}

export function KolSection() {
  const { t } = useLanguage();
  const [paused, setPaused] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState(0);
  const phaseRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const holdRef = useRef(false);
  const length = kolList.length;
  const isHeld = paused || hoveredIndex !== null;

  useEffect(() => {
    holdRef.current = isHeld;
  }, [isHeld]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    function step(ts: number) {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;
      if (!holdRef.current) {
        phaseRef.current += dt / MS_PER_STEP;
        setPhase(phaseRef.current);
      }
      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, []);

  const nudge = (delta: number) => {
    phaseRef.current += delta;
    setPhase(phaseRef.current);
  };
  const goTo = (index: number) => {
    const current = ((phaseRef.current % length) + length) % length;
    let delta = index - current;
    if (delta > length / 2) delta -= length;
    if (delta < -length / 2) delta += length;
    nudge(delta);
  };

  const activeIndex = Math.round(((phaseRef.current % length) + length) % length) % length;

  return (
    <Container className="py-30">
      <div className="mb-14 flex flex-wrap items-end justify-between gap-8">
        <SectionHeading eyebrow={t.home.kol.eyebrow} title={t.home.kol.title} subtitle={t.home.kol.subtitle} />
        <div className="flex flex-shrink-0 items-center gap-2.5">
          <ArrowButton direction="prev" onClick={() => nudge(-1)} label={t.common.prevSlide} />
          <MarqueeToggle
            paused={paused}
            onToggle={() => setPaused((p) => !p)}
            pauseLabel={t.common.pauseCarousel}
            playLabel={t.common.playCarousel}
          />
          <ArrowButton direction="next" onClick={() => nudge(1)} label={t.common.nextSlide} />
        </div>
      </div>

      <div className="relative h-[440px] sm:h-[480px] lg:h-[520px]" style={{ perspective: "1600px" }}>
        {kolList.map((kol, index) => {
          const offset = continuousOffset(index, phase, length);
          const absOffset = Math.min(Math.abs(offset), length / 2);
          const arcT = absOffset / (length / 2);
          const isActive = index === activeIndex;
          // Hovering only lifts/enlarges a card in place — it never recenters the
          // carousel. Re-centering on hover used to shift the whole layout under
          // a fixed cursor position, which could land a different card under the
          // pointer and re-trigger hover in a runaway loop (looked like the cards
          // racing/flickering). Keeping position untouched removes that loop.
          const isHovered = index === hoveredIndex;

          const translateX = offset * CARD_SPACING_PX;
          const translateY = -(arcT * arcT) * ARC_LIFT_PX - (isHovered ? 22 : 0);
          // Rotation caps out once a card is a full step away — further cards keep
          // sliding out and shrinking, but never tilt past this angle into an
          // edge-on sliver.
          const rotateY = -clamp(offset, -1, 1) * CARD_ROTATE_DEG;
          const baseScale = 1 - absOffset * CARD_SCALE_STEP;
          const scale = isHovered ? baseScale * 1.1 : baseScale;

          // Continuous falloff instead of a hard isActive on/off switch, so the
          // caption and shadow cross-fade smoothly through the moment two cards
          // pass each other instead of popping right at the handoff.
          const closeness = isHovered ? 1 : clamp(1 - absOffset / CAPTION_FADE_RANGE, 0, 1);
          const shadowAlpha = 0.16 + closeness * 0.1;
          const shadowBlur = 34 + closeness * 14;
          const shadowY = 16 + closeness * 12;
          const edgeFadeStart = length / 2 - EDGE_FADE_RANGE;
          const cardOpacity = clamp((length / 2 - absOffset) / (length / 2 - edgeFadeStart), 0, 1);

          return (
            <figure
              key={kol.name}
              onClick={() => !isActive && goTo(index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex((current) => (current === index ? null : current))}
              className={`absolute top-1/2 left-1/2 m-0 aspect-[3/4] w-56 overflow-hidden rounded-[24px] bg-wash sm:w-64 lg:w-72 ${
                isHeld ? "transition-transform duration-300 ease-soft" : ""
              } ${isActive ? "" : "cursor-pointer"}`}
              style={{
                transform: `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) rotateY(${rotateY}deg) scale(${scale})`,
                zIndex: isHovered ? 2000 : Math.round(1000 - absOffset * 100),
                opacity: cardOpacity,
                boxShadow: `0 ${shadowY}px ${shadowBlur}px rgba(22,33,62,${shadowAlpha})`,
              }}
            >
              <Image src={kol.image} alt={kol.name} fill sizes="288px" className="object-cover" priority={isActive} />
              <figcaption
                className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,rgba(18,41,42,0.85),transparent)] p-4 text-[15px] font-semibold text-white sm:text-base"
                style={{ opacity: closeness }}
              >
                {kol.name}
              </figcaption>
            </figure>
          );
        })}
      </div>

      <div className="mt-8 flex justify-center gap-2.5">
        {kolList.map((kol, index) => (
          <button
            key={kol.name}
            type="button"
            aria-label={kol.name}
            aria-current={index === activeIndex}
            onClick={() => goTo(index)}
            className="flex items-center justify-center p-1.5"
          >
            <span
              className={`block h-2 rounded-full transition-all duration-300 ease-soft ${
                index === activeIndex ? "w-5.5 bg-accent" : "w-2 bg-line"
              }`}
            />
          </button>
        ))}
      </div>
    </Container>
  );
}
