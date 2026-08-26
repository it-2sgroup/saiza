// Ghép tên file theo "PERMATE: Quy tắc đặt tên file & thư mục" v1.0, mục 2 & 5:
// [MãTổChức-]MãPhòngBan_LoạiTàiLiệu_NộiDung_YYYYMMDD_Version, tối đa ~80 ký tự.
const UNSAFE_CHARS = /[\\/:*?"<>|]/g;

// "chiến dịch q3" -> "ChiếnDịchQ3" — PascalCase theo từng từ, giữ dấu tiếng Việt, bỏ khoảng trắng.
export function toPascalCaseVN(input: string): string {
  return input
    .trim()
    .replace(UNSAFE_CHARS, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase("vi") + word.slice(1))
    .join("");
}

export function todayYYYYMMDD(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function dateInputToYYYYMMDD(value: string): string {
  // value from <input type="date"> is YYYY-MM-DD
  return value.replaceAll("-", "");
}

export type FileNameParts = {
  org?: string | null;
  department: string;
  docType: string;
  content: string;
  date: string; // YYYYMMDD
  version: string;
  wip?: boolean;
};

export function buildFileName(parts: FileNameParts): string {
  const deptSegment = parts.org ? `${parts.org}-${parts.department}` : parts.department;
  const contentSegment = toPascalCaseVN(parts.content);
  const base = [deptSegment, parts.docType, contentSegment, parts.date, parts.version].join("_");
  return parts.wip ? `WIP_${base}` : base;
}

export const MAX_FILENAME_LENGTH = 80;

// Thư mục không phải tài liệu có phiên bản — chỉ cần định danh theo tổ chức/phòng
// ban + tên, không có LoạiTàiLiệu/Ngày/Version như file.
export type FolderNameParts = {
  org?: string | null;
  department: string;
  name: string;
};

export function buildFolderName(parts: FolderNameParts): string {
  const deptSegment = parts.org ? `${parts.org}-${parts.department}` : parts.department;
  return [deptSegment, toPascalCaseVN(parts.name)].join("_");
}
