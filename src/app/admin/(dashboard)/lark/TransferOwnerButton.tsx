"use client";

import { useActionState, useState } from "react";
import { transferLarkDocumentOwner, type TransferOwnerState } from "./actions";
import type { LarkFileType } from "@/lib/lark/client";
import type { StaffOption } from "./StaffSharePicker";
import { PeoplePicker } from "./PeoplePicker";

const initialState: TransferOwnerState = { error: null };

export function TransferOwnerButton({
  documentId,
  fileType = "docx",
  staff = [],
  variant = "link",
}: {
  documentId: string;
  fileType?: LarkFileType;
  staff?: StaffOption[];
  variant?: "link" | "button";
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, formAction, pending] = useActionState(transferLarkDocumentOwner.bind(null, documentId, fileType), initialState);

  const triggerClassName =
    variant === "button"
      ? "w-fit cursor-pointer rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-accent hover:text-accent"
      : "w-fit cursor-pointer text-xs font-medium text-accent hover:text-ink";

  if (state.done) return <span className="text-xs text-ink-2">Đã chuyển quyền sở hữu.</span>;

  return (
    <div className="flex flex-col gap-2.5">
      <button type="button" onClick={() => setOpen((o) => !o)} className={triggerClassName}>
        {open ? "Đóng" : variant === "button" ? "Chuyển owner" : "Chuyển quyền sở hữu →"}
      </button>
      {open && (
        <form action={formAction} className="flex flex-col gap-2.5 rounded-xl border border-line bg-paper p-3">
          <p className="text-xs text-ink-2">
            Người này sẽ trở thành chủ sở hữu thật trên Lark. App sẽ mất quyền quản lý (Xoá/Di chuyển trên web này) file này sau khi chuyển.
          </p>
          <PeoplePicker
            staff={staff}
            value={email}
            onChange={setEmail}
            name="email"
            placeholder="Nhập tên hoặc email@2sgroup.vn"
            inputClassName="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-[13.5px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          />
          {state.error && <p className="text-xs font-medium text-red-600">{state.error}</p>}
          <button
            type="submit"
            disabled={pending || !email.trim()}
            className="w-fit cursor-pointer rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Đang chuyển..." : "Chuyển quyền sở hữu"}
          </button>
        </form>
      )}
    </div>
  );
}
