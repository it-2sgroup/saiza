// Kept in code on purpose, unlike DEPARTMENTS/ORG_CODES/DOC_TYPES (now in the
// config_lists table — see src/lib/admin/configLists.ts) — v1/v2/v3/draft/
// final is a generic file-versioning convention, not org-specific business
// data an admin would need to add to.
export const VERSION_OPTIONS = ["v1", "v2", "v3", "draft", "final"] as const;
