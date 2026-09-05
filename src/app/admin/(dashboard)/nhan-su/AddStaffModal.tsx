"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ui/Button";
import { Modal, ModalHeader } from "../Modal";
import { StaffForm } from "./StaffForm";
import type { ConfigOption } from "@/lib/admin/configLists";
import type { RoleOption } from "@/lib/admin/roleCapabilities";

export function AddStaffModal({ departments, roles }: { departments: ConfigOption[]; roles: RoleOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ActionButton variant="accent" onClick={() => setOpen(true)} className="px-6 py-3 text-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Thêm nhân viên
      </ActionButton>

      <Modal open={open} onClose={() => setOpen(false)} panelClassName="max-h-[88vh] w-full max-w-[480px] overflow-y-auto p-6">
        <ModalHeader title="Thêm nhân viên mới" subtitle="Gửi lời mời qua email để họ tự tạo mật khẩu." onClose={() => setOpen(false)} />
        <StaffForm departments={departments} roles={roles} />
      </Modal>
    </>
  );
}
