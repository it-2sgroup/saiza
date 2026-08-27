"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ui/Button";
import { Modal, ModalHeader } from "../Modal";
import { LARK_FILE_TYPE_LABELS, type LarkFileType } from "@/lib/lark/fileTypes";
import type { FolderOption } from "@/lib/lark/folders";
import type { StaffOption } from "./StaffSharePicker";
import { LarkDocForm } from "./LarkDocForm";
import type { LarkPrefs } from "@/lib/lark/prefs";

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
  prefs,
}: {
  defaultDepartment: string | null;
  staff: StaffOption[];
  foldersByOrg: Record<string, FolderOption[]>;
  prefs: LarkPrefs;
}) {
  const [open, setOpen] = useState(false);
  const [fileType, setFileType] = useState<LarkFileType | null>(null);

  const closeModal = () => {
    setOpen(false);
    setFileType(null);
  };

  return (
    <>
      <ActionButton variant="accent" onClick={() => setOpen(true)} className="w-fit flex-shrink-0 px-5 py-2.5 text-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Tạo file mới
      </ActionButton>

      <Modal open={open} onClose={closeModal} panelClassName="max-h-[88vh] w-full max-w-[640px] overflow-y-auto p-6">
        <ModalHeader
          title={fileType ? `Tạo ${LARK_FILE_TYPE_LABELS[fileType]}` : "Tạo file mới"}
          subtitle={fileType ? "Điền thông tin bên dưới, tên file sẽ tự chuẩn hoá." : "Chọn loại file bạn muốn tạo trong Lark."}
          onClose={closeModal}
        />

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
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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
            prefs={prefs}
          />
        )}
      </Modal>
    </>
  );
}
