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
  // "bottom" (default) anchors the panel below the trigger; "top" flips it
  // above when there isn't enough room below — without this, a trigger near
  // the bottom of the viewport (e.g. the last row of a long list) portals a
  // panel that's clipped by the viewport edge with no way to reach its
  // lower items.
  const [placement, setPlacement] = useState<"top" | "bottom">("bottom");
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

  // Re-measures whenever the anchor moves AND whenever the panel's own size
  // changes (e.g. ItemActionsMenu swapping its plain list for a taller
  // sub-action form) — a ResizeObserver catches the latter, which a
  // dependency array alone can't since panelRef is a ref, not state.
  useLayoutEffect(() => {
    if (!open || !anchorRect || !panelRef.current) return;
    const recalc = () => {
      if (!panelRef.current) return;
      const panelHeight = panelRef.current.getBoundingClientRect().height;
      const spaceBelow = window.innerHeight - anchorRect.bottom;
      const spaceAbove = anchorRect.top;
      setPlacement(spaceBelow < panelHeight + 8 && spaceAbove > spaceBelow ? "top" : "bottom");
    };
    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(panelRef.current);
    return () => ro.disconnect();
  }, [open, anchorRect]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      // A nested popover (e.g. the folder Combobox inside ItemActionsMenu's
      // Move form) portals its own panel to `document.body` too, so its
      // DOM node is a *sibling* of this panel, not a descendant — the checks
      // above don't see it. Without this, clicking an option in the nested
      // popover reads as "outside" the outer one and closes it before the
      // click can register, e.g. Move silently doing nothing.
      if (target instanceof Element && target.closest("[data-popover-panel]")) return;
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

  return { rootRef, panelRef, anchorRect, placement };
}
