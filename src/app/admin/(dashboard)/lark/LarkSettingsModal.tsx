"use client";

import { useActionState, useState } from "react";
import { updateLarkPrefs, type LarkPrefsState } from "./actions";
import { Combobox } from "../Combobox";
import { Modal, ModalHeader } from "../Modal";
import { ORG_CODES } from "@/lib/admin/departments";
import { VERSION_OPTIONS } from "@/lib/admin/docTypes";
import { DEFAULT_LARK_PREFS, type LarkPrefs } from "@/lib/lark/prefs";

const initialState: LarkPrefsState = { error: null };
const fieldClasses =
  "rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14.5px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

const ORG_OPTIONS = [{ value: "", label: "Không đặt sẵn" }, ...ORG_CODES.map((o) => ({ value: o, label: o }))];
const VERSION_SELECT_OPTIONS = [{ value: "", label: "Không đặt sẵn" }, ...VERSION_OPTIONS.map((v) => ({ value: v, label: v }))];

const TOGGLES: { key: keyof typeof DEFAULT_LARK_PREFS; label: string; hint: string }[] = [
  { key: "includeDept", label: "Phòng ban", hint: "Đưa mã phòng ban vào tên file theo mặc định" },
  { key: "includeDocType", label: "Loại tài liệu", hint: "Đưa loại tài liệu (Báo cáo, Kế hoạch...) vào tên file" },
  { key: "includeDate", label: "Ngày", hint: "Đưa ngày tạo (YYYYMMDD) vào tên file" },
  { key: "includeVersion", label: "Version", hint: "Đưa version (v1, v2...) vào tên file" },
];

export function LarkSettingsModal({ prefs, trigger }: { prefs: LarkPrefs; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateLarkPrefs, initialState);

  const [toggles, setToggles] = useState({ ...DEFAULT_LARK_PREFS, ...prefs });
  const [defaultOrg, setDefaultOrg] = useState(prefs.defaultOrg ?? "");
  const [defaultVersion, setDefaultVersion] = useState(prefs.defaultVersion ?? "");

  const settingsIcon = (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );

  return (
    <>
      {trigger ? (
        <span className="contents" onClick={() => setOpen(true)}>
          {trigger}
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Cài đặt mặc định"
          aria-label="Cài đặt mặc định"
          className="flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-card text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink"
        >
          {settingsIcon}
        </button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} panelClassName="max-h-[88vh] w-full max-w-[480px] overflow-y-auto p-6">
        <ModalHeader
          title="Cài đặt mặc định"
          subtitle="Áp dụng cho mọi lần bạn tạo file mới — có thể đổi lại từng lần."
          onClose={() => setOpen(false)}
        />

        <form action={formAction} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-semibold tracking-[0.06em] text-ink-2 uppercase">Tiền tố trong tên file</h3>
            {TOGGLES.map((t) => (
              <label key={t.key} className="flex items-center justify-between gap-4 rounded-xl border border-line px-3.5 py-2.5">
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-ink">{t.label}</span>
                  <span className="text-xs text-ink-2">{t.hint}</span>
                </span>
                <input
                  type="checkbox"
                  name={t.key}
                  checked={toggles[t.key]}
                  onChange={(e) => setToggles((prev) => ({ ...prev, [t.key]: e.target.checked }))}
                  className="h-4 w-4 flex-shrink-0 accent-accent"
                />
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-semibold tracking-[0.06em] text-ink-2 uppercase">Giá trị đặt sẵn</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium tracking-[0.06em] text-ink-2 uppercase">Mã tổ chức</label>
                <Combobox
                  name="defaultOrg"
                  value={defaultOrg}
                  options={ORG_OPTIONS}
                  onChange={setDefaultOrg}
                  buttonClassName={`${fieldClasses} flex w-full items-center justify-between gap-2 text-left`}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium tracking-[0.06em] text-ink-2 uppercase">Version</label>
                <Combobox
                  name="defaultVersion"
                  value={defaultVersion}
                  options={VERSION_SELECT_OPTIONS}
                  onChange={setDefaultVersion}
                  buttonClassName={`${fieldClasses} flex w-full items-center justify-between gap-2 text-left`}
                />
              </div>
            </div>
          </div>

          {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
          {state.success && <p className="text-sm font-medium text-accent-2">Đã lưu cài đặt.</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-fit cursor-pointer rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Đang lưu..." : "Lưu cài đặt"}
          </button>
        </form>
      </Modal>
    </>
  );
}
