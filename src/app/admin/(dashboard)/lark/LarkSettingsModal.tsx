"use client";

import { useActionState, useEffect, useState } from "react";
import { updateLarkPrefs, type LarkPrefsState } from "./actions";
import { Combobox } from "../Combobox";
import { Toggle } from "./Toggle";
import { NamingPreviewBox } from "./NamingPreviewBox";
import { ORG_CODES } from "@/lib/admin/departments";
import { VERSION_OPTIONS } from "@/lib/admin/docTypes";
import { DEFAULT_LARK_PREFS, type LarkPrefs } from "@/lib/lark/prefs";
import { buildNamingSegments, todayYYYYMMDD } from "@/lib/admin/fileNaming";

const initialState: LarkPrefsState = { error: null };
const fieldClasses =
  "rounded-[9px] border border-line bg-paper px-3.5 py-2.5 text-[13.5px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

const ORG_OPTIONS = [{ value: "", label: "Không đặt sẵn" }, ...ORG_CODES.map((o) => ({ value: o, label: o }))];
const VERSION_SELECT_OPTIONS = [{ value: "", label: "Không đặt sẵn" }, ...VERSION_OPTIONS.map((v) => ({ value: v, label: v }))];

const TOGGLES: { key: keyof typeof DEFAULT_LARK_PREFS; label: string; hint: string; dot: string }[] = [
  { key: "includeDept", label: "Mã phòng ban", hint: "VD: SAIZA-IT_...", dot: "#14B8A6" },
  { key: "includeDocType", label: "Loại tài liệu", hint: "Báo cáo, Kế hoạch, Biên bản...", dot: "#F59E0B" },
  { key: "includeDate", label: "Ngày tạo", hint: "Định dạng YYYYMMDD", dot: "#3B82F6" },
  { key: "includeVersion", label: "Version", hint: "v1, v2, v3...", dot: "#D946EF" },
];

export function LarkSettingsModal({
  prefs,
  department = null,
  trigger,
}: {
  prefs: LarkPrefs;
  department?: string | null;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateLarkPrefs, initialState);

  const [toggles, setToggles] = useState({ ...DEFAULT_LARK_PREFS, ...prefs });
  const [defaultOrg, setDefaultOrg] = useState(prefs.defaultOrg ?? "");
  const [defaultVersion, setDefaultVersion] = useState(prefs.defaultVersion ?? "");
  const today = todayYYYYMMDD();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const segments = buildNamingSegments({ ...toggles, defaultOrg, defaultVersion }, department, today);

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
          className="flex h-10 flex-shrink-0 cursor-pointer items-center gap-2 rounded-[9px] border border-line bg-card px-4 text-sm font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink"
        >
          {settingsIcon}
          Quy ước tên
        </button>
      )}

      {open && (
        <div className="animate-drawer-fade fixed inset-0 z-[100] flex justify-end bg-ink/40" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-drawer-slide flex h-full w-full max-w-[420px] flex-col bg-card shadow-[-24px_0_60px_rgba(9,9,11,0.2)] font-[family-name:var(--font-ibm-plex-sans)]"
          >
            <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-line p-5">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-[15px] font-semibold text-ink">Quy ước đặt tên</h2>
                <p className="text-[12.5px] text-ink-2">Áp dụng cho mọi file mới — vẫn sửa được từng lần.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
                className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-2 transition-colors duration-300 ease-soft hover:bg-wash hover:text-ink"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form action={formAction} className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
              <div className="flex flex-1 flex-col gap-5">
                <NamingPreviewBox segments={segments} />

                <div className="flex flex-col gap-2">
                  <h3 className="text-[11px] font-semibold tracking-[0.06em] text-ink-2 uppercase">Thành phần trong tên file</h3>
                  {TOGGLES.map((t) => (
                    <div
                      key={t.key}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-[11px] border border-line px-3.5 py-3"
                      onClick={() => setToggles((prev) => ({ ...prev, [t.key]: !prev[t.key] }))}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="h-[7px] w-[7px] flex-shrink-0 rounded-[2px]" style={{ background: t.dot }} />
                          <span className="text-[12.5px] font-semibold text-ink">{t.label}</span>
                        </div>
                        <div className="mt-0.5 text-[11.5px] text-ink-2">{t.hint}</div>
                      </div>
                      <Toggle checked={toggles[t.key]} onChange={(v) => setToggles((prev) => ({ ...prev, [t.key]: v }))} name={t.key} />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2.5">
                  <h3 className="text-[11px] font-semibold tracking-[0.06em] text-ink-2 uppercase">Giá trị đặt sẵn</h3>
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
              </div>

              <div className="mt-5 flex flex-shrink-0 gap-2.5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 cursor-pointer rounded-[9px] border border-line py-2.5 text-[13px] font-semibold text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 cursor-pointer rounded-[9px] bg-accent py-2.5 text-[13px] font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? "Đang lưu..." : "Lưu quy ước"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
