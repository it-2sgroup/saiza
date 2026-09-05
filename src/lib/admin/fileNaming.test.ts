import { describe, it, expect } from "vitest";
import { buildFileName, buildFolderName, sanitizeNameSegment, dateInputToYYYYMMDD, todayYYYYMMDD, MAX_FILENAME_LENGTH } from "./fileNaming";

describe("sanitizeNameSegment", () => {
  it("title-cases Vietnamese words and keeps diacritics", () => {
    expect(sanitizeNameSegment("chiến dịch q3")).toBe("Chiến Dịch Q3");
  });

  it("collapses repeated internal whitespace", () => {
    expect(sanitizeNameSegment("báo   cáo   tuần")).toBe("Báo Cáo Tuần");
  });

  it("strips filesystem-unsafe characters", () => {
    expect(sanitizeNameSegment('a/b\\c:d*e?f"g<h>i|j')).toBe("Abcdefghij");
  });

  it("collapses to empty when the input is ONLY unsafe characters", () => {
    // This is the case a caller must check for explicitly — it doesn't throw,
    // it just silently produces "", which the actions.ts caller now validates.
    expect(sanitizeNameSegment("///")).toBe("");
    expect(sanitizeNameSegment('***???"""')).toBe("");
  });

  it("returns empty for whitespace-only input", () => {
    expect(sanitizeNameSegment("   ")).toBe("");
  });
});

describe("buildFileName", () => {
  const base = { org: "SAIZA", department: "IT", docType: "Báo Cáo", content: "Test", date: "20260101", version: "v1" };

  it("joins every present segment in order with underscores", () => {
    expect(buildFileName(base)).toBe("SAIZA-IT_Báo Cáo_Test_20260101_v1");
  });

  it("omits department from the org-department segment when department is null", () => {
    expect(buildFileName({ ...base, department: null })).toBe("SAIZA_Báo Cáo_Test_20260101_v1");
  });

  it("omits org from the org-department segment when org is null", () => {
    expect(buildFileName({ ...base, org: null })).toBe("IT_Báo Cáo_Test_20260101_v1");
  });

  it("drops the whole first segment when both org and department are null", () => {
    expect(buildFileName({ ...base, org: null, department: null })).toBe("Báo Cáo_Test_20260101_v1");
  });

  it("drops optional segments independently without leaving stray underscores", () => {
    expect(buildFileName({ ...base, docType: null })).toBe("SAIZA-IT_Test_20260101_v1");
    expect(buildFileName({ ...base, date: null })).toBe("SAIZA-IT_Báo Cáo_Test_v1");
    expect(buildFileName({ ...base, version: null })).toBe("SAIZA-IT_Báo Cáo_Test_20260101");
    expect(buildFileName({ ...base, docType: null, date: null, version: null })).toBe("SAIZA-IT_Test");
  });

  it("title-cases and sanitizes the content segment", () => {
    expect(buildFileName({ ...base, content: "kế hoạch quý 4" })).toBe("SAIZA-IT_Báo Cáo_Kế Hoạch Quý 4_20260101_v1");
  });

  it("prefixes WIP_ when wip is set, after all other segments are joined", () => {
    expect(buildFileName({ ...base, wip: true })).toBe("WIP_SAIZA-IT_Báo Cáo_Test_20260101_v1");
  });

  it("does not double the WIP_ prefix or apply it anywhere but the front", () => {
    const name = buildFileName({ ...base, wip: true, content: "wip content" });
    expect(name.startsWith("WIP_")).toBe(true);
    expect(name.match(/WIP_/g)?.length).toBe(1);
  });
});

describe("buildFolderName", () => {
  it("joins org-department and the sanitized name", () => {
    expect(buildFolderName({ org: "SAIZA", department: "IT", name: "dự án x" })).toBe("SAIZA-IT_Dự Án X");
  });

  it("falls back to just the name when org and department are both null", () => {
    expect(buildFolderName({ org: null, department: null, name: "dự án x" })).toBe("Dự Án X");
  });
});

describe("dateInputToYYYYMMDD", () => {
  it("strips dashes from an <input type=date> value", () => {
    expect(dateInputToYYYYMMDD("2026-09-05")).toBe("20260905");
  });
});

describe("todayYYYYMMDD", () => {
  it("returns an 8-digit numeric string", () => {
    expect(todayYYYYMMDD()).toMatch(/^\d{8}$/);
  });
});

describe("MAX_FILENAME_LENGTH", () => {
  it("is a sane positive bound the caller can enforce", () => {
    expect(MAX_FILENAME_LENGTH).toBeGreaterThan(0);
    expect(MAX_FILENAME_LENGTH).toBeLessThan(256);
  });
});
