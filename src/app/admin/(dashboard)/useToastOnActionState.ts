"use client";

import { useEffect, useRef } from "react";
import { useToast } from "./ToastProvider";

// Fires a toast once when a useActionState result actually changes — every
// mutating form in the Lark admin (create/move/delete/transfer/share/save
// prefs) follows the same shape: `{ error }` on failure, some truthy field
// on success. Skips the initial mount so a freshly-opened form never shows
// a stale toast from its starting state.
export function useToastOnActionState(state: { error?: string | null }, successMessage: string | null) {
  const toast = useToast();
  const prevState = useRef(state);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevState.current = state;
      return;
    }
    if (state === prevState.current) return;
    prevState.current = state;

    if (state.error) toast.error(state.error);
    else if (successMessage) toast.success(successMessage);
  }, [state, successMessage, toast]);
}
