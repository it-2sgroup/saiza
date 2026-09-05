import { describe, it, expect } from "vitest";
import { departmentLabel, DEPARTMENT_CODES, DEPARTMENTS } from "./departments";

describe("departmentLabel", () => {
  it("returns null for null/undefined/empty — the 'chưa gán phòng ban' case", () => {
    expect(departmentLabel(null)).toBeNull();
    expect(departmentLabel(undefined)).toBeNull();
    expect(departmentLabel("")).toBeNull();
  });

  it("resolves a known code to its Vietnamese label", () => {
    expect(departmentLabel("IT")).toBe("Công nghệ thông tin");
  });

  it("falls back to the raw code for an unknown/stale code instead of throwing or returning null", () => {
    // A department can be renamed/removed from DEPARTMENTS after employees
    // were already assigned it — the profile row keeps the old code, so this
    // must degrade to showing the code itself, not silently say "chưa gán".
    expect(departmentLabel("DELETED_DEPT")).toBe("DELETED_DEPT");
  });
});

describe("DEPARTMENT_CODES", () => {
  it("has one code per department, all unique", () => {
    expect(DEPARTMENT_CODES.length).toBe(DEPARTMENTS.length);
    expect(new Set(DEPARTMENT_CODES).size).toBe(DEPARTMENT_CODES.length);
  });
});
