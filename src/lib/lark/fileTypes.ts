// Client-safe constants (no "server-only") shared between src/lib/lark/client.ts
// and client components that need to render/select a file type.
//
// Only Lark object types with an official, documented Open API "create"
// endpoint are listed. Slides/Forms/MindNotes have no public create endpoint
// (Slides' create endpoint responds but is undocumented/unofficial), so
// they're deliberately left out rather than relying on unstable behavior.
export type LarkFileType = "docx" | "sheet" | "bitable" | "folder";

export const LARK_FILE_TYPE_LABELS: Record<LarkFileType, string> = {
  docx: "Tài liệu (Docs)",
  sheet: "Bảng tính (Sheets)",
  bitable: "Cơ sở dữ liệu (Base)",
  folder: "Thư mục con",
};

// Every list in this feature mixes documents and folders (creating a folder
// records the same `lark_doc_created` audit row as creating a doc), so copy
// that hardcodes "file" is wrong as soon as a folder appears in it — a folder
// row sitting under a "Tên file" header, or "8 file" counting 3 folders.
//
// Pass the active type filter: with one selected the wording can be specific,
// and with none ("all") it has to be the neutral "mục".
export function itemNoun(fileType?: LarkFileType | "" | null): string {
  if (fileType === "folder") return "thư mục";
  if (fileType) return "file";
  return "mục";
}

// Same idea for a count, where the list can be inspected directly: "8 mục"
// only when folders are actually present, otherwise the more natural "8 file".
export function countNoun(types: (LarkFileType | undefined)[]): string {
  const hasFolder = types.some((t) => t === "folder");
  const hasFile = types.some((t) => t && t !== "folder");
  if (hasFolder && !hasFile) return "thư mục";
  if (hasFolder) return "mục";
  return "file";
}
