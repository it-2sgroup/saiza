"use client";

import { useState } from "react";
import { Modal, ModalHeader } from "../Modal";
import { Btn } from "../controls";
import { LARK_FILE_TYPE_LABELS, type LarkFileType } from "@/lib/lark/fileTypes";
import type { FolderOption } from "@/lib/lark/folders";
import type { StaffOption } from "./StaffSharePicker";
import { LarkDocForm } from "./LarkDocForm";
import type { LarkPrefs } from "@/lib/lark/prefs";
import type { ConfigOption } from "@/lib/admin/configLists";

type TypeCard = {
  type: LarkFileType;
  description: string;
  badgeClassName: string;
  icon: React.ReactNode;
};

const TYPE_CARDS: TypeCard[] = [
  {
    type: "docx",
    description: "Văn bản, báo cáo",
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
    description: "Bảng tính",
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
    description: "Cơ sở dữ liệu",
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
    description: "Gom nhiều file",
    badgeClassName: "bg-amber-100 text-amber-600",
    icon: (
      <>
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      </>
    ),
  },
];

const DEFAULT_TYPE: LarkFileType = "docx";

export function CreateFileModal({
  defaultDepartment,
  staff,
  foldersByOrg,
  prefs,
  trigger,
  initialType,
  departments,
  orgCodes,
  docTypes,
}: {
  defaultDepartment: string | null;
  staff: StaffOption[];
  foldersByOrg: Record<string, FolderOption[]>;
  prefs: LarkPrefs;
  trigger?: React.ReactNode;
  initialType?: LarkFileType;
  departments: ConfigOption[];
  orgCodes: ConfigOption[];
  docTypes: ConfigOption[];
}) {
  const [open, setOpen] = useState(false);
  const [fileType, setFileType] = useState<LarkFileType>(
    initialType ?? DEFAULT_TYPE,
  );

  const closeModal = () => {
    setOpen(false);
    setFileType(initialType ?? DEFAULT_TYPE);
  };

  return (
    <>
      {trigger ? (
        <span className="contents" onClick={() => setOpen(true)}>
          {trigger}
        </span>
      ) : (
        <Btn variant="primary" onClick={() => setOpen(true)}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Tạo file mới
        </Btn>
      )}

      <Modal
        open={open}
        onClose={closeModal}
        panelClassName="flex max-h-[88vh] w-full max-w-[820px] flex-col overflow-hidden p-6"
      >
        <ModalHeader
          title="Tạo file mới"
          subtitle="Tên file sẽ tự chuẩn hoá."
          onClose={closeModal}
        />

        <div className="flex min-h-0 flex-1 flex-col gap-5 sm:flex-row">
          <div className="flex flex-shrink-0 flex-col gap-1.5 sm:w-[220px]">
            {TYPE_CARDS.map((card) => {
              const active = card.type === fileType;
              return (
                <button
                  key={card.type}
                  type="button"
                  onClick={() => setFileType(card.type)}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors duration-150 ${
                    active
                      ? "border-accent bg-wash"
                      : "border-line hover:border-ink/25 hover:bg-wash"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${card.badgeClassName}`}
                  >
                    <svg
                      width="17"
                      height="17"
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
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium text-ink">
                      {LARK_FILE_TYPE_LABELS[card.type]}
                    </span>
                    <span className="truncate text-[12px] leading-snug text-ink-2">
                      {card.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            <LarkDocForm
              fileType={fileType}
              defaultDepartment={defaultDepartment}
              staff={staff}
              foldersByOrg={foldersByOrg}
              prefs={prefs}
              departments={departments}
              orgCodes={orgCodes}
              docTypes={docTypes}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
