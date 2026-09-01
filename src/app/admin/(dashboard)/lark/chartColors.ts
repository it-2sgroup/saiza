// Plain constants module (no "use client") so Server Components can safely
// read these values directly — named exports from a "use client" file are
// replaced with client-reference stubs when imported into a Server
// Component, so plain data (not a component) must live outside that boundary.
export const ADOPTION_COLORS = { active: "#0B84D8", inactive: "#B9C4D9" } as const;
