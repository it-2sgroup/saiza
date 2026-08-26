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
