import { describe, it, expect } from "vitest";
import { normalizeLarkPrefs, DEFAULT_LARK_PREFS } from "./prefs";

describe("normalizeLarkPrefs", () => {
  it("returns an empty object for null/non-object input (e.g. a fresh profile row)", () => {
    expect(normalizeLarkPrefs(null)).toEqual({});
    expect(normalizeLarkPrefs(undefined)).toEqual({});
    expect(normalizeLarkPrefs("garbage")).toEqual({});
    expect(normalizeLarkPrefs(42)).toEqual({});
  });

  it("passes through well-typed known fields", () => {
    const raw = {
      includeDept: false,
      includeDocType: true,
      includeDate: true,
      includeVersion: false,
      defaultOrg: "SAIZA",
      defaultVersion: "v2",
      defaultDepartment: "IT",
      defaultDocType: "Kế Hoạch",
      activeApp: "sova",
    };
    expect(normalizeLarkPrefs(raw)).toEqual(raw);
  });

  it("drops fields with the wrong type instead of trusting them — a hand-edited or corrupted jsonb row can't smuggle a non-boolean into a boolean toggle", () => {
    const raw = { includeDept: "yes", defaultOrg: 123, activeApp: null };
    expect(normalizeLarkPrefs(raw)).toEqual({});
  });

  it("drops unknown extra fields", () => {
    expect(normalizeLarkPrefs({ includeDept: true, unknownField: "x" })).toEqual({ includeDept: true });
  });
});

describe("DEFAULT_LARK_PREFS", () => {
  it("defaults every toggle on", () => {
    expect(DEFAULT_LARK_PREFS).toEqual({
      includeDept: true,
      includeDocType: true,
      includeDate: true,
      includeVersion: true,
    });
  });
});
