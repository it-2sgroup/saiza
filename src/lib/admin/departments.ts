// Mã phòng ban thống nhất — theo "PERMATE: Quy tắc đặt tên file & thư mục" v1.0 (22/08/2026), mục 3.
// Thêm mã mới thì cập nhật cả tài liệu đó, không tự thêm mã lệch chuẩn ở đây.
export type DepartmentCode = {
  code: string;
  label: string;
  note?: string;
};

export const DEPARTMENTS: DepartmentCode[] = [
  { code: "BGD", label: "Ban Giám đốc", note: "Tài liệu chiến lược, báo cáo cấp cao" },
  { code: "KT", label: "Tài chính – Kế toán" },
  { code: "HCNS", label: "Hành chính – Nhân sự" },
  { code: "MKT", label: "Marketing" },
  { code: "MD", label: "Media (video và live)" },
  { code: "IT", label: "Công nghệ thông tin" },
  { code: "SP", label: "Sản phẩm" },
  { code: "KD", label: "Kinh doanh" },
  { code: "TT", label: "Kênh TikTok", note: "Thuộc Phòng Kinh doanh" },
  { code: "SHP", label: "Kênh Shopee", note: "Thuộc Phòng Kinh doanh" },
  { code: "FB", label: "Kênh Facebook", note: "Thuộc Phòng Kinh doanh" },
  { code: "BK", label: "Booking", note: "Thuộc kênh TikTok" },
  { code: "VH", label: "Vận hành" },
  { code: "CSKH", label: "Chăm sóc khách hàng" },
  { code: "TM", label: "Thu mua" },
  { code: "ALL", label: "Toàn công ty", note: "Tài liệu dùng chung cho mọi phòng ban" },
];

export const DEPARTMENT_CODES = DEPARTMENTS.map((d) => d.code);

export function departmentLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  return DEPARTMENTS.find((d) => d.code === code)?.label ?? code;
}

// Mã tổ chức/thương hiệu — mục 3.1. Chỉ cần khi tài liệu áp dụng riêng cho
// một tổ chức cụ thể; bỏ trống nếu dùng chung toàn hệ thống.
export const ORG_CODES = ["SISMO", "SAIZA", "2S"] as const;
