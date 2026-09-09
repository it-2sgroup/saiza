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
    const supabase = createClient();
    const channel = supabase
      .channel(`lark-sync:${appKey}`)
      .on("broadcast", { event: "changed" }, () => router.refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appKey, router]);

  return null;
}
