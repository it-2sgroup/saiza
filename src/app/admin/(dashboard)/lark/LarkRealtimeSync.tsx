"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Invisible — mounted once at the top of the page, independent of which
// LarkTabPanel is active. A Server Action's revalidatePath() only refreshes
// the browser tab that ran it; this listens for the "changed" Broadcast that
// notifyLarkChanged() sends after every create/move/trash/restore/purge (see
// src/lib/lark/broadcast.ts) and asks THIS tab to refetch, so a second
// window left open on "File của tôi" or "Thùng rác" doesn't keep showing a
// file someone else just deleted or restored elsewhere.
export function LarkRealtimeSync({ appKey }: { appKey: string }) {
  const router = useRouter();

  useEffect(() => {
    // Best-effort, like every other Lark integration point in this app: a
    // blocked/failed Realtime connection (CSP, network, an extension, a
    // Supabase outage) must degrade to "no live sync, reload manually to see
    // others' changes" — never to an uncaught error that takes the whole
    // page down. (A CSP misconfiguration blocking the WebSocket did exactly
    // that once; the CSP is fixed, but this stays as defense-in-depth.)
    try {
      const supabase = createClient();
      const channel = supabase
        .channel(`lark-sync:${appKey}`)
        .on("broadcast", { event: "changed" }, () => router.refresh())
        .subscribe((status, err) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("[LarkRealtimeSync] channel unavailable:", err);
          }
        });

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch {
          // Ignore — the page is unmounting anyway.
        }
      };
    } catch (err) {
      console.warn("[LarkRealtimeSync] failed to start:", err);
      return undefined;
    }
  }, [appKey, router]);

  return null;
}
