"use client";

import { useActionState, useState } from "react";
import { addRoleAction, updateRoleAction, removeRoleAction } from "./actions";
import { useToastOnActionState } from "../useToastOnActionState";
import type { RoleOption } from "@/lib/admin/roleCapabilities";
import type { RoleMutationState } from "@/lib/admin/roles";

const initialState: RoleMutationState = { error: null };
const fieldClasses =
  "rounded-lg border border-line bg-paper px-3 py-2 text-[13.5px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

const CAP_FIELDS: { key: keyof Omit<RoleOption, "code" | "label">; label: string; hint: string }[] = [
  {
    key: "isSuperAdmin",
    label: "Quản trị tối cao",
    hint: "Sửa Danh mục/Vai trò, xem toàn bộ nhật ký, không thể là vai trò cuối cùng bị xoá.",
  },
  { key: "canManageStaff", label: "Quản lý nhân sự", hint: "Mời/sửa/xoá tài khoản nhân viên." },
  { key: "canManageContent", label: "Đăng nội dung website", hint: "Đăng/sửa/xoá Tin tức, Tuyển dụng, Sản phẩm." },
  { key: "canDraftContent", label: "Lưu bản nháp nội dung", hint: "Tạo/sửa bản nháp nội dung của chính mình." },
  { key: "canManageLarkOrgWide", label: "Quản lý mọi file Lark", hint: "Xoá/di chuyển/chuyển quyền sở hữu file Lark của bất kỳ ai." },
  { key: "canViewInbox", label: "Xem hộp thư liên hệ", hint: "Xem form liên hệ khách hàng gửi từ website." },
];

function CapFields({ defaults }: { defaults?: RoleOption }) {
  const [caps, setCaps] = useState<Record<string, boolean>>(Object.fromEntries(CAP_FIELDS.map((f) => [f.key, defaults?.[f.key] ?? false])));
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {CAP_FIELDS.map((f) => (
        <label
          key={f.key}
          className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line px-3 py-2.5 transition-colors duration-300 ease-soft hover:border-ink"
        >
          <input
            type="checkbox"
            name={f.key}
            checked={caps[f.key]}
            onChange={(e) => setCaps((prev) => ({ ...prev, [f.key]: e.target.checked }))}
            className="mt-0.5 h-3.5 w-3.5 accent-accent"
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-[12.5px] font-semibold text-ink">{f.label}</span>
            <span className="text-[11px] leading-snug text-ink-2">{f.hint}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

function AddRoleForm() {
  const [state, formAction, pending] = useActionState(addRoleAction, initialState);
  useToastOnActionState(state, state.success ? "Đã thêm vai trò." : null);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");

  return (
    <form
      action={(fd) => {
        formAction(fd);
        setCode("");
        setLabel("");
      }}
      className="flex flex-col gap-3 rounded-xl border border-dashed border-line p-3.5"
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Mã (VD: hr)"
          required
          className={fieldClasses}
        />
        <input
          name="label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Tên hiển thị (VD: Nhân sự)"
          required
          className={fieldClasses}
        />
      </div>
      <CapFields />
      {state.error && <p className="text-xs font-medium text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-fit cursor-pointer rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Đang thêm..." : "+ Thêm vai trò"}
      </button>
    </form>
  );
}

function RoleRow({ role }: { role: RoleOption }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeState, setRemoveState] = useState<RoleMutationState>(initialState);
  const [updateState, updateAction, updatePending] = useActionState(updateRoleAction, initialState);
  useToastOnActionState(updateState, updateState.success ? "Đã lưu." : null);

  const [handledUpdateState, setHandledUpdateState] = useState(updateState);
  if (updateState !== handledUpdateState) {
    setHandledUpdateState(updateState);
    if (updateState.success) setEditing(false);
  }

  if (editing) {
    return (
      <form action={updateAction} className="flex flex-col gap-3 rounded-xl border border-accent/40 bg-wash/40 p-3.5">
        <input type="hidden" name="code" value={role.code} />
        <input name="label" defaultValue={role.label} required className={fieldClasses} />
        <CapFields defaults={role} />
        {updateState.error && <p className="text-xs font-medium text-red-600">{updateState.error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={updatePending}
            className="cursor-pointer rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updatePending ? "Đang lưu..." : "Lưu"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="cursor-pointer rounded-full border border-line px-3.5 py-1.5 text-xs font-medium text-ink-2 hover:border-ink hover:text-ink"
          >
            Huỷ
          </button>
        </div>
      </form>
    );
  }

  const grantedCaps = CAP_FIELDS.filter((f) => role[f.key]).map((f) => f.label);

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-line px-3.5 py-3">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
          <span className="rounded-full bg-wash px-2 py-0.5 text-[11px] font-semibold text-ink-2">{role.code}</span>
          {role.label}
        </span>
        <span className="text-xs text-ink-2">{grantedCaps.length > 0 ? grantedCaps.join(", ") : "Không có quyền đặc biệt"}</span>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1.5">
        {confirming ? (
          <>
            <span className="text-xs text-ink-2">Xoá vai trò này?</span>
            <button
              type="button"
              disabled={removing}
              onClick={async () => {
                setRemoving(true);
                const result = await removeRoleAction(role.code);
                setRemoving(false);
                setRemoveState(result);
                if (!result.error) setConfirming(false);
              }}
              className="cursor-pointer rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white transition-colors duration-300 ease-soft hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {removing ? "..." : "Xác nhận"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="cursor-pointer rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-2 hover:border-ink hover:text-ink"
            >
              Huỷ
            </button>
          </>
        ) : (
          <>
            {removeState.error && <span className="text-xs font-medium text-red-600">{removeState.error}</span>}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="cursor-pointer rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink"
            >
              Sửa
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="cursor-pointer rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition-colors duration-300 ease-soft hover:bg-red-50"
            >
              Xoá
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function RoleEditor({ roles }: { roles: RoleOption[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {roles.map((r) => (
        <RoleRow key={r.code} role={r} />
      ))}
      <AddRoleForm />
    </div>
  );
}
