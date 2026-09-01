"use client";

import { useActionState, useState } from "react";
import { updateLarkPrefs, type LarkPrefsState } from "./actions";
import { Combobox } from "../Combobox";
import { Toggle } from "./Toggle";
import { NamingPreviewBox } from "./NamingPreviewBox";
import { ORG_CODES, DEPARTMENTS } from "@/lib/admin/departments";
import { VERSION_OPTIONS, DOC_TYPES } from "@/lib/admin/docTypes";
import { DEFAULT_LARK_PREFS, type LarkPrefs } from "@/lib/lark/prefs";
import { buildNamingSegments, todayYYYYMMDD } from "@/lib/admin/fileNaming";

const initialState: LarkPrefsState = { error: null };
const fieldClasses =
  "rounded-[9px] border border-line bg-paper px-3.5 py-2.5 text-[13.5px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

const ORG_OPTIONS = [{ value: "", label: "Không đặt sẵn" }, ...ORG_CODES.map((o) => ({ value: o, label: o }))];
const VERSION_SELECT_OPTIONS = [{ value: "", label: "Không đặt sẵn" }, ...VERSION_OPTIONS.map((v) => ({ value: v, label: v }))];
const DEPARTMENT_OPTIONS = [
  { value: "", label: "Theo hồ sơ nhân viên" },
  ...DEPARTMENTS.map((d) => ({ value: d.code, label: `${d.code} — ${d.label}` })),
];
const DOC_TYPE_OPTIONS = [{ value: "", label: "Không đặt sẵn" }, ...DOC_TYPES.map((d) => ({ value: d.code, label: d.label }))];

const TOGGLES: { key: keyof typeof DEFAULT_LARK_PREFS; label: string; hint: string; dot: string }[] = [
  { key: "includeDept", label: "Mã phòng ban", hint: "VD: SAIZA-IT_...", dot: "#14B8A6" },
  { key: "includeDocType", label: "Loại tài liệu", hint: "Báo cáo, Kế hoạch, Biên bản...", dot: "#F59E0B" },
  { key: "includeDate", label: "Ngày tạo", hint: "Định dạng YYYYMMDD", dot: "#3B82F6" },
  { key: "includeVersion", label: "Version", hint: "v1, v2, v3...", dot: "#D946EF" },
];

// Shared form body for editing naming-convention prefs — used both inline
// (Overview tab card, no chrome) and inside LarkSettingsModal's drawer.
export function NamingSettingsPanel({
  prefs,
  department = null,
  footer,
}: {
  prefs: LarkPrefs;
  department?: string | null;
  footer?: (pending: boolean) => React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(updateLarkPrefs, initialState);
  const [toggles, setToggles] = useState({ ...DEFAULT_LARK_PREFS, ...prefs });
  const [defaultOrg, setDefaultOrg] = useState(prefs.defaultOrg ?? "");
  const [defaultVersion, setDefaultVersion] = useState(prefs.defaultVersion ?? "");
  const [defaultDepartment, setDefaultDepartment] = useState(prefs.defaultDepartment ?? "");
  const [defaultDocType, setDefaultDocType] = useState(prefs.defaultDocType ?? "");
  const today = todayYYYYMMDD();

  const segments = buildNamingSegments({ ...toggles, defaultOrg, defaultVersion, defaultDepartment, defaultDocType }, department, today);

  return (
    <form action={formAction} className="flex flex-col gap-5">
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
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium tracking-[0.06em] text-ink-2 uppercase">Phòng ban</label>
            <Combobox
              name="defaultDepartment"
              value={defaultDepartment}
              options={DEPARTMENT_OPTIONS}
              onChange={setDefaultDepartment}
              buttonClassName={`${fieldClasses} flex w-full items-center justify-between gap-2 text-left`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium tracking-[0.06em] text-ink-2 uppercase">Loại tài liệu</label>
            <Combobox
              name="defaultDocType"
              value={defaultDocType}
              options={DOC_TYPE_OPTIONS}
              onChange={setDefaultDocType}
              buttonClassName={`${fieldClasses} flex w-full items-center justify-between gap-2 text-left`}
            />
          </div>
        </div>
      </div>

      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm font-medium text-accent-2">Đã lưu cài đặt.</p>}

      {footer ? (
        footer(pending)
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="w-fit cursor-pointer rounded-[9px] bg-accent px-5 py-2.5 text-[13px] font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Đang lưu..." : "Lưu quy ước"}
        </button>
      )}
    </form>
  );
}
