import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Dictionary, Locale } from "@/lib/i18n/types";
import { vi } from "@/lib/i18n/vi";
import { en } from "@/lib/i18n/en";

export type TextField = {
  key: string;
  group: string;
  label: string;
  defaultVi: string;
  defaultEn: string;
};

function humanize(segment: string) {
  const spaced = segment.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function groupOf(path: string[]) {
  if (path[0] === "home" && path.length > 1) return `home.${path[1]}`;
  return path[0];
}

// Builds a short human label from the path segments that come AFTER the
// group prefix. Numeric segments (array indices) fold into the preceding
// chunk as "#N" instead of appearing as their own token, so
// `home.whyUs.items.0.title` (group "home.whyUs") reads as "Items #1 › Title"
// rather than "Items › 0 › Title".
function labelFromTail(tail: string[]): string {
  const chunks: string[] = [];
  for (const seg of tail) {
    if (/^\d+$/.test(seg)) {
      const idx = Number(seg) + 1;
      if (chunks.length > 0) chunks[chunks.length - 1] = `${chunks[chunks.length - 1]} #${idx}`;
      else chunks.push(`#${idx}`);
    } else {
      chunks.push(humanize(seg));
    }
  }
  return chunks.length > 0 ? chunks.join(" › ") : "Giá trị";
}

// Walks the vi/en dictionaries in lockstep and emits one TextField per leaf
// string. Handles plain nesting, arrays of strings, and arrays of objects
// uniformly — no special-casing needed per section.
function walk(nodeVi: unknown, nodeEn: unknown, path: string[], out: TextField[]) {
  if (typeof nodeVi === "string") {
    const group = groupOf(path);
    const tail = path.slice(group.split(".").length);
    out.push({
      key: path.join("."),
      group,
      label: labelFromTail(tail),
      defaultVi: nodeVi,
      defaultEn: typeof nodeEn === "string" ? nodeEn : nodeVi,
    });
    return;
  }
  if (Array.isArray(nodeVi)) {
    nodeVi.forEach((item, i) => {
      walk(item, Array.isArray(nodeEn) ? nodeEn[i] : undefined, [...path, String(i)], out);
    });
    return;
  }
  if (nodeVi && typeof nodeVi === "object") {
    for (const key of Object.keys(nodeVi as Record<string, unknown>)) {
      const enChild = nodeEn && typeof nodeEn === "object" ? (nodeEn as Record<string, unknown>)[key] : undefined;
      walk((nodeVi as Record<string, unknown>)[key], enChild, [...path, key], out);
    }
  }
}

export function flattenDictionary(): TextField[] {
  const out: TextField[] = [];
  walk(vi, en, [], out);
  return out;
}

export const getTextOverrides = cache(async (): Promise<Record<string, { vi: string; en: string }>> => {
  const supabase = await createClient();
  const { data } = await supabase.from("site_text").select("key, value_vi, value_en");
  const map: Record<string, { vi: string; en: string }> = {};
  for (const row of data ?? []) map[row.key] = { vi: row.value_vi, en: row.value_en };
  return map;
});

function setPath(obj: Record<string, unknown>, path: string[], value: string) {
  let node: unknown = obj;
  for (let i = 0; i < path.length - 1; i++) {
    node = (node as Record<string, unknown>)[path[i]];
  }
  (node as Record<string, unknown>)[path[path.length - 1]] = value;
}

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  const base: Dictionary = JSON.parse(JSON.stringify(locale === "vi" ? vi : en));
  const overrides = await getTextOverrides();

  for (const [key, value] of Object.entries(overrides)) {
    const localized = value[locale];
    if (!localized) continue;
    setPath(base as unknown as Record<string, unknown>, key.split("."), localized);
  }

  return base;
}

// Admin-only: reads every override row directly via the service-role client
// (bypasses RLS, used from the admin dashboard where the caller's role has
// already been checked).
export async function getAllTextOverridesForAdmin(): Promise<Record<string, { vi: string; en: string }>> {
  const admin = createAdminClient();
  const { data } = await admin.from("site_text").select("key, value_vi, value_en");
  const map: Record<string, { vi: string; en: string }> = {};
  for (const row of data ?? []) map[row.key] = { vi: row.value_vi, en: row.value_en };
  return map;
}
