// Bảng loại tài liệu thường dùng — "PERMATE: Quy tắc đặt tên file & thư mục" v1.0, mục 4.
export type DocTypeCode = {
  code: string;
  label: string;
  usage: string;
};

export const DOC_TYPES: DocTypeCode[] = [
  { code: "BáoCáo", label: "Báo cáo", usage: "Báo cáo định kỳ, báo cáo dự án" },
  { code: "KếHoạch", label: "Kế hoạch", usage: "Kế hoạch, đề xuất" },
  { code: "HợpĐồng", label: "Hợp đồng", usage: "Hợp đồng, phụ lục hợp đồng" },
  { code: "BiênBản", label: "Biên bản", usage: "Biên bản họp / nghiệm thu" },
  { code: "TàiLiệu", label: "Tài liệu", usage: "Tài liệu kỹ thuật, hướng dẫn" },
  { code: "Template", label: "Template", usage: "Biểu mẫu, mẫu dùng lại" },
  { code: "ChínhSách", label: "Chính sách", usage: "Chính sách nội bộ" },
];

export const VERSION_OPTIONS = ["v1", "v2", "v3", "draft", "final"] as const;
