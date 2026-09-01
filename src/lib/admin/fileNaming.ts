// Ghép tên file theo "PERMATE: Quy tắc đặt tên file & thư mục" v1.0, mục 2 & 5:
// [MãTổChức-]MãPhòngBan_LoạiTàiLiệu_NộiDung_YYYYMMDD_Version, tối đa ~80 ký tự.
const UNSAFE_CHARS = /[\\/:*?"<>|]/g;

// "chiến dịch q3" -> "Chiến Dịch Q3" — viết hoa đầu mỗi từ, giữ dấu tiếng Việt và khoảng trắng giữa các từ.
function toTitleCaseVN(input: string): string {
  return input
    .trim()
    .replace(UNSAFE_CHARS, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase("vi") + word.slice(1))
    .join(" ");
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

// Mỗi tiền tố (phòng ban/loại tài liệu/ngày/version) là tuỳ chọn — truyền null
// để bỏ qua đoạn đó khỏi tên file thay vì bắt buộc phải có đủ.
export type FileNameParts = {
  org?: string | null;
  department: string | null;
  docType: string | null;
  content: string;
  date: string | null; // YYYYMMDD
  version: string | null;
  wip?: boolean;
};

export function buildFileName(parts: FileNameParts): string {
  const deptSegment = parts.department ? (parts.org ? `${parts.org}-${parts.department}` : parts.department) : parts.org;
  const segments = [deptSegment, parts.docType, toTitleCaseVN(parts.content), parts.date, parts.version].filter((s): s is string => !!s);
  const base = segments.join("_");
  return parts.wip ? `WIP_${base}` : base;
}

export const MAX_FILENAME_LENGTH = 80;

// Color-coded example segments for the "Quy ước đặt tên" live preview — one
// color per naming component, matching across the settings drawer and the
// Tổng quan overview card. `today` is passed in (not computed here) so this
// stays a pure function callable from a Server Component without tripping
// the no-Date-in-render rule.
export type NamingSegment = { text: string; color: string };

export function buildNamingSegments(
  prefs: {
    includeDept: boolean;
    includeDocType: boolean;
    includeDate: boolean;
    includeVersion: boolean;
    defaultOrg?: string | null;
    defaultVersion?: string | null;
    defaultDepartment?: string | null;
    defaultDocType?: string | null;
  },
  department: string | null,
  today: string,
): NamingSegment[] {
  const effectiveDepartment = department || prefs.defaultDepartment;
  const segments: NamingSegment[] = [{ text: prefs.defaultOrg || "SAIZA", color: "#4F46E5" }];
  if (prefs.includeDept) segments.push({ text: `-${effectiveDepartment || "IT"}`, color: "#0D9488" });
  if (prefs.includeDocType) segments.push({ text: `_${prefs.defaultDocType || "Báo Cáo"}`, color: "#B45309" });
  segments.push({ text: "_Báo Cáo Tuần 36", color: "#18181B" });
  if (prefs.includeDate) segments.push({ text: `_${today}`, color: "#2563EB" });
  if (prefs.includeVersion) segments.push({ text: `_${prefs.defaultVersion || "v1"}`, color: "#A21CAF" });
  return segments;
}

// Thư mục không phải tài liệu có phiên bản — chỉ cần định danh theo tổ chức/phòng
// ban + tên, không có LoạiTàiLiệu/Ngày/Version như file.
export type FolderNameParts = {
  org?: string | null;
  department: string | null;
  name: string;
};

export function buildFolderName(parts: FolderNameParts): string {
  const deptSegment = parts.department ? (parts.org ? `${parts.org}-${parts.department}` : parts.department) : parts.org;
  const segments = [deptSegment, toTitleCaseVN(parts.name)].filter((s): s is string => !!s);
  return segments.join("_");
}
