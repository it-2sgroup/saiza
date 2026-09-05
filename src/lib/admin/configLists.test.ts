import { describe, it, expect } from "vitest";
import { resolveConfigLabel, type ConfigOption } from "./configListHelpers";

const OPTIONS: ConfigOption[] = [
  { code: "IT", label: "Công nghệ thông tin", note: null },
  { code: "KT", label: "Tài chính – Kế toán", note: null },
];

describe("resolveConfigLabel", () => {
  it("returns null for null/undefined/empty — the 'chưa gán' case", () => {
    expect(resolveConfigLabel(null, OPTIONS)).toBeNull();
    expect(resolveConfigLabel(undefined, OPTIONS)).toBeNull();
    expect(resolveConfigLabel("", OPTIONS)).toBeNull();
  });

  it("resolves a known code to its current label", () => {
    expect(resolveConfigLabel("IT", OPTIONS)).toBe("Công nghệ thông tin");
  });

  it("falls back to the raw code for a renamed/removed option instead of throwing or returning null", () => {
    // A department/org/doc-type can be renamed or deleted from config_lists
    // after staff/files already referenced the old code — this must degrade
    // to showing the code itself, not silently say "chưa gán".
    expect(resolveConfigLabel("DELETED_CODE", OPTIONS)).toBe("DELETED_CODE");
  });
});
