// Decodes a Supabase access token's payload WITHOUT verifying the signature —
// callers must only use this for claims that are safe to trust because the
// token itself already passed through Supabase's own verification to reach
// here (e.g. `supabase.auth.getSession()` only returns a session backed by a
// token Supabase has already validated). Never use this to authenticate a
// token from an arbitrary/untrusted source.
export function decodeJwtClaims(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    const json = Buffer.from(payload, "base64url").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}
