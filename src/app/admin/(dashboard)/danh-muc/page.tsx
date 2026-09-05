import { getCurrentProfile } from "@/lib/supabase/profile";
import { canManageStaff, isSuperAdmin } from "@/lib/admin/permissions";
import { getConfigLists } from "@/lib/admin/configLists";
import { getRoles } from "@/lib/admin/roles";
import { ConfigListEditor } from "./ConfigListEditor";
import { RoleEditor } from "./RoleEditor";

const SECTIONS: { key: "department" | "org_code" | "doc_type"; title: string; hint: string }[] = [
  {
    key: "department",
    title: "Phòng ban",
    hint: "Dùng để gán nhân viên và tự động đặt tên/tạo thư mục file Lark theo phòng ban.",
  },
  {
    key: "org_code",
    title: "Mã tổ chức",
    hint: "Tiền tố tên file khi tài liệu áp dụng riêng cho một thương hiệu/tổ chức cụ thể.",
  },
  {
    key: "doc_type",
    title: "Loại tài liệu",
    hint: "Nhóm tài liệu (báo cáo, kế hoạch, hợp đồng...) hiển thị trong tên file Lark.",
  },
];

export default async function DanhMucPage() {
  const profile = await getCurrentProfile();
  if (!profile || !(await canManageStaff(profile.role))) {
    return <p className="text-ink-2">Bạn không có quyền truy cập trang này.</p>;
  }

  const [{ departments, orgCodes, docTypes }, roles, allowManageRoles] = await Promise.all([
    getConfigLists(),
    getRoles(),
    isSuperAdmin(profile.role),
  ]);
  const optionsByKey = { department: departments, org_code: orgCodes, doc_type: docTypes };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium">Danh mục</h1>
        <p className="text-ink-2">Quản lý các danh sách dùng chung trong hệ thống — thêm, sửa, xoá mà không cần nhờ kỹ thuật sửa code.</p>
      </div>

      <div className="flex flex-col gap-8">
        {SECTIONS.map((section) => (
          <div key={section.key} className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-[15px] font-semibold text-ink">{section.title}</h2>
              <p className="text-xs text-ink-2">{section.hint}</p>
            </div>
            <ConfigListEditor listKey={section.key} options={optionsByKey[section.key]} />
          </div>
        ))}

        {allowManageRoles && (
          <div className="flex flex-col gap-3 border-t border-line pt-8">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-[15px] font-semibold text-ink">Vai trò</h2>
              <p className="text-xs text-ink-2">
                Chỉ Quản trị tối cao mới sửa được mục này — mỗi vai trò là một tập quyền, gán sai có thể cấp nhầm quyền quản trị.
              </p>
            </div>
            <RoleEditor roles={roles} />
          </div>
        )}
      </div>
    </div>
  );
}
