"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// Shared behavior behind every portal-anchored dropdown in the admin UI
// (Combobox, PeoplePicker, AppSwitcher, ItemActionsMenu): track the
// trigger's on-screen position while open (recomputed on resize/scroll),
// and close on outside click or Escape. Callers still portal their own
// panel and derive their own top/left/width from `anchorRect` — panel
// sizing differs enough per caller (fixed width vs. viewport-clamped,
// vs. width driven by other state) that folding it in here would just
// relocate the per-caller logic somewhere less visible.
export function useAnchoredPopover(open: boolean, onClose: () => void) {
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;
    const updateRect = () => setAnchorRect(rootRef.current!.getBoundingClientRect());
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
    // Intentionally only re-runs on `open` — `onClose` is typically a fresh
    // inline closure each render, and re-subscribing on every render for a
    // dropdown's listeners isn't worth chasing a stable reference for.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return { rootRef, panelRef, anchorRect };
}
