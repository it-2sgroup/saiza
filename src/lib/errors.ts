import "server-only";

/**
 * Marks an error message as already written for the end user — thrown
 * deliberately by our own code (e.g. "ownership was transferred outside
 * this app" in client.ts), as opposed to a raw Lark API / Postgres error
 * bubbling up. `friendlyError` shows this verbatim instead of replacing it
 * with the generic fallback.
 */
export class UserFacingError extends Error {}

/**
 * Every catch block wrapping a Lark API / Postgres call used to forward
 * `err.message` straight to the user — which meant raw Lark error codes,
 * English HTTP status text, or Postgres constraint messages could show up
 * as a red banner in the admin UI. This logs the real error server-side
 * (where whoever's debugging can still see it) and returns a fixed,
 * hand-written Vietnamese message for the user instead.
 *
 * Deliberately takes a fallback per call site rather than one generic
 * string everywhere — "Không tạo được file" vs "Không xoá được file" still
 * tells the user which action failed, without leaking how.
 */
export function friendlyError(context: string, err: unknown, fallback: string): string {
  if (err instanceof UserFacingError) return err.message;
  console.error(`[${context}]`, err);
  return fallback;
}
