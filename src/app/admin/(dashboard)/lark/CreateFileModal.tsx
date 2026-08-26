"use client";

import { useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/Button";
import { LARK_FILE_TYPE_LABELS, type LarkFileType } from "@/lib/lark/fileTypes";
import type { FolderOption } from "@/lib/lark/folders";
import type { StaffOption } from "./StaffSharePicker";
import { LarkDocForm } from "./LarkDocForm";

type TypeCard = {
  type: LarkFileType;
  description: string;
  badgeClassName: string;
  icon: React.ReactNode;
};

const TYPE_CARDS: TypeCard[] = [
  {
    type: "docx",
    description: "Văn bản, báo cáo, ghi chú",
    badgeClassName: "bg-blue-100 text-blue-600",
    icon: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M9 13h6M9 17h6" />
      </>
    ),
  },
  {
    type: "sheet",
    description: "Bảng tính, dữ liệu dạng cột",
    badgeClassName: "bg-green-100 text-green-600",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
      </>
    ),
  },
  {
    type: "bitable",
    description: "Cơ sở dữ liệu, quản lý theo bảng",
    badgeClassName: "bg-purple-100 text-purple-600",
    icon: (
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
        <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
      </>
    ),
  },
  {
    type: "folder",
    description: "Gom nhiều file lại một chỗ",
    badgeClassName: "bg-amber-100 text-amber-600",
    icon: (
      <>
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      </>
    ),
  },
];

export function CreateFileModal({
  defaultDepartment,
  staff,
  foldersByOrg,
}: {
  defaultDepartment: string | null;
  staff: StaffOption[];
  foldersByOrg: Record<string, FolderOption[]>;
}) {
  const [open, setOpen] = useState(false);
  const [fileType, setFileType] = useState<LarkFileType | null>(null);

  const closeModal = () => {
    setOpen(false);
    setFileType(null);
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <ActionButton variant="accent" onClick={() => setOpen(true)} className="px-6 py-3 text-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Tạo file mới
      </ActionButton>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" onClick={closeModal}>
          <div
            className="max-h-[88vh] w-full max-w-[640px] animate-soft-in overflow-y-auto rounded-card bg-card p-6 shadow-[0_30px_60px_rgba(22,33,62,0.35)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">
                  {fileType ? `Tạo ${LARK_FILE_TYPE_LABELS[fileType]}` : "Tạo file mới"}
                </h2>
                <p className="text-sm text-ink-2">
                  {fileType ? "Điền thông tin bên dưới, tên file sẽ tự chuẩn hoá." : "Chọn loại file bạn muốn tạo trong Lark."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Đóng"
                className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-2 transition-colors duration-300 ease-soft hover:bg-wash hover:text-ink"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!fileType ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {TYPE_CARDS.map((card) => (
                  <button
                    key={card.type}
                    type="button"
                    onClick={() => setFileType(card.type)}
                    className="flex cursor-pointer flex-col items-center gap-2.5 rounded-2xl border border-line p-4 text-center transition-colors duration-300 ease-soft hover:border-accent hover:bg-wash"
                  >
                    <span className={`flex h-11 w-11 items-center justify-center rounded-full ${card.badgeClassName}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {card.icon}
                      </svg>
                    </span>
                    <span className="text-[13.5px] font-semibold text-ink">{LARK_FILE_TYPE_LABELS[card.type]}</span>
                    <span className="text-[11.5px] leading-snug text-ink-2">{card.description}</span>
                  </button>
                ))}
              </div>
            ) : (
              <LarkDocForm
                fileType={fileType}
                onBack={() => setFileType(null)}
                defaultDepartment={defaultDepartment}
                staff={staff}
                foldersByOrg={foldersByOrg}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
