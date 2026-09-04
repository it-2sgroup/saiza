import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { getAppRootFolderToken } from "@/lib/lark/client";
import { listFolderContentsCached } from "@/lib/lark/driveCache";
import { addFoldersToCache } from "@/lib/lark/folders";

// Folder browsing lives in a route handler rather than a Server Action on
// purpose: Next.js serialises Server Action calls from the same client, so a
// prefetch in flight would block the navigation the user actually triggered.
// Plain fetches run in parallel, which is what makes hover-prefetch useful.
export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Bạn cần đăng nhập lại." }, { status: 401 });

  const url = new URL(request.url);
  const appKey = url.searchParams.get("app");
  if (!appKey) return NextResponse.json({ error: "Thiếu app." }, { status: 400 });

  // Empty/absent `folder` means "the app's root folder" — the client doesn't
  // know the root token, so it can't pass one on the first load.
  const requested = url.searchParams.get("folder");
  // Speculative prefetches skip child-warming so a burst of them can't
  // multiply into a burst of upstream Lark calls.
  const isPrefetch = url.searchParams.get("prefetch") === "1";

  try {
    const folderToken = requested || (await getAppRootFolderToken(appKey));
    const items = await listFolderContentsCached(folderToken, appKey, { warmChildren: !isPrefetch });

    // Write-through into lark_folder_cache — otherwise pre-existing folders
    // (created outside this app, or missed by the last BFS crawl) only ever
    // show up in the Drive tab and never in the Move/Create-file pickers,
    // which build their options purely from that cache.
    const discoveredFolders = items
      .filter((i) => i.type === "folder")
      .map((i) => ({ token: i.token, name: i.name, parentToken: folderToken }));
    if (discoveredFolders.length > 0) {
      await addFoldersToCache("", discoveredFolders, appKey);
    }

    return NextResponse.json({ folderToken, items });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Không đọc được thư mục." }, { status: 500 });
  }
}
