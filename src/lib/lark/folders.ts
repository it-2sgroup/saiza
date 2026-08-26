import "server-only";
import { listFolderChildren } from "./client";

export type FolderOption = { token: string; name: string; depth: number };

const MAX_DEPTH = 4;
const MAX_FOLDERS = 150;

// BFS walk of the shared root folder so the create form can offer a
// destination picker. Bounded by depth/count so a runaway folder tree can't
// blow up request time.
export async function listLarkFolderTree(rootToken: string): Promise<FolderOption[]> {
  const result: FolderOption[] = [];
  let queue: { token: string; depth: number }[] = [{ token: rootToken, depth: 0 }];

  while (queue.length > 0 && result.length < MAX_FOLDERS) {
    const { token, depth } = queue.shift()!;
    if (depth >= MAX_DEPTH) continue;

    let children: Awaited<ReturnType<typeof listFolderChildren>>;
    try {
      children = await listFolderChildren(token);
    } catch {
      continue;
    }

    for (const child of children) {
      if (result.length >= MAX_FOLDERS) break;
      result.push({ token: child.token, name: child.name, depth: depth + 1 });
      queue.push({ token: child.token, depth: depth + 1 });
    }
  }

  return result;
}
