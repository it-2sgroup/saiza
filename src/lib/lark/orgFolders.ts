import "server-only";
import { getLarkAppConfig } from "./client";

// Root folder for a given org code, within the given app's Drive space —
// falling back to that app's shared default (docFolderToken) when the org
// has no dedicated root configured, or none was selected ("Không riêng").
export function resolveRootFolderToken(org: string | null | undefined, appKey?: string): string | undefined {
  const app = getLarkAppConfig(appKey);
  const fallback = app.docFolderToken?.trim() || undefined;
  if (!org) return fallback;
  return app.orgFolderTokens?.[org] ?? fallback;
}

export function listConfiguredOrgs(appKey?: string): string[] {
  return Object.keys(getLarkAppConfig(appKey).orgFolderTokens ?? {});
}
