// Bảng loại tài liệu thường dùng — "PERMATE: Quy tắc đặt tên file & thư mục" v1.0, mục 4.
export type DocTypeCode = {
  code: string;
  label: string;
  usage: string;
};

export const DOC_TYPES: DocTypeCode[] = [
  { code: "Báo Cáo", label: "Báo cáo", usage: "Báo cáo định kỳ, báo cáo dự án" },
  { code: "Kế Hoạch", label: "Kế hoạch", usage: "Kế hoạch, đề xuất" },
  { code: "Hợp Đồng", label: "Hợp đồng", usage: "Hợp đồng, phụ lục hợp đồng" },
  { code: "Biên Bản", label: "Biên bản", usage: "Biên bản họp / nghiệm thu" },
  { code: "Tài Liệu", label: "Tài liệu", usage: "Tài liệu kỹ thuật, hướng dẫn" },
  { code: "Template", label: "Template", usage: "Biểu mẫu, mẫu dùng lại" },
  { code: "Chính Sách", label: "Chính sách", usage: "Chính sách nội bộ" },
];

export const VERSION_OPTIONS = ["v1", "v2", "v3", "draft", "final"] as const;
