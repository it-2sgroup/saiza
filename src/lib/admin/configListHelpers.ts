// Client-safe (no "server-only") — split out of configLists.ts so this pure
// lookup can be unit-tested and, if ever needed, called from a client
// component without dragging in the Supabase admin client. Same pattern as
// src/lib/lark/fileTypes.ts.
export type ConfigOption = { code: string; label: string; note: string | null };

/** Resolves a stored code to its current human label — falls back to the raw code if it was renamed/removed. */
export function resolveConfigLabel(code: string | null | undefined, options: ConfigOption[]): string | null {
  if (!code) return null;
  return options.find((o) => o.code === code)?.label ?? code;
}
