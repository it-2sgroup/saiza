"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./ToastProvider";

// Fires a toast once when a useActionState result actually changes — every
// mutating form in the Lark admin (create/move/delete/transfer/share/save
// prefs) follows the same shape: `{ error }` on failure, some truthy field
// on success. Skips the initial mount so a freshly-opened form never shows
// a stale toast from its starting state.
//
// Also refreshes the router on success: every one of these actions calls
// revalidatePath server-side, but that alone only invalidates the Next.js
// cache — it does NOT push new data to a component already mounted on the
// page (e.g. the Drive tab sitting next to whatever form just ran). Without
// this, a newly created/moved/deleted file only appeared after a manual
// full-page reload. router.refresh() is what actually re-runs the page's
// server fetch and hands the fresh result down as new props.
export function useToastOnActionState(
  state: { error?: string | null },
  successMessage: string | null,
) {
  const toast = useToast();
  const router = useRouter();
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

    if (state.error) {
      toast.error(state.error);
    } else {
      if (successMessage) toast.success(successMessage);
      router.refresh();
    }
  }, [state, successMessage, toast, router]);
}
