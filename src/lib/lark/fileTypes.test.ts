import { describe, it, expect } from "vitest";
import { itemNoun, countNoun, LARK_FILE_TYPE_LABELS } from "./fileTypes";

describe("itemNoun", () => {
  it("says 'thư mục' when filtered to folders", () => {
    expect(itemNoun("folder")).toBe("thư mục");
  });

  it("says 'file' when filtered to any non-folder type", () => {
    expect(itemNoun("docx")).toBe("file");
    expect(itemNoun("sheet")).toBe("file");
    expect(itemNoun("bitable")).toBe("file");
  });

  it("says the neutral 'mục' when no filter is active", () => {
    expect(itemNoun("")).toBe("mục");
    expect(itemNoun(null)).toBe("mục");
    expect(itemNoun(undefined)).toBe("mục");
  });
});

describe("countNoun", () => {
  it("says 'file' when the list is all documents", () => {
    expect(countNoun(["docx", "docx", "sheet"])).toBe("file");
  });

  it("says 'thư mục' when the list is all folders", () => {
    expect(countNoun(["folder", "folder"])).toBe("thư mục");
  });

  it("says the neutral 'mục' when the list mixes files and folders — this is the bug from the screenshot", () => {
    // Regression test: a list header hardcoded "Tên file" while showing a
    // mix of docs and folders (e.g. HistoryModal/OverviewModal before the
    // fix) mislabels every folder row. A mixed list must use neutral wording.
    expect(countNoun(["docx", "folder"])).toBe("mục");
    expect(countNoun(["folder", "sheet", "bitable"])).toBe("mục");
  });

  it("defaults to 'file' for an empty list", () => {
    expect(countNoun([])).toBe("file");
  });

  it("ignores undefined entries", () => {
    expect(countNoun([undefined, undefined])).toBe("file");
  });
});

describe("LARK_FILE_TYPE_LABELS", () => {
  it("has a label for every supported file type", () => {
    expect(LARK_FILE_TYPE_LABELS.docx).toBeTruthy();
    expect(LARK_FILE_TYPE_LABELS.sheet).toBeTruthy();
    expect(LARK_FILE_TYPE_LABELS.bitable).toBeTruthy();
    expect(LARK_FILE_TYPE_LABELS.folder).toBeTruthy();
  });
});
