"use client";

import { useActionState, useState } from "react";
import { updateLarkPrefs, type LarkPrefsState } from "./actions";
import { Combobox } from "../Combobox";
import { Toggle } from "./Toggle";
import { NamingPreviewBox } from "./NamingPreviewBox";
import type { ConfigOption } from "@/lib/admin/configLists";
import { VERSION_OPTIONS } from "@/lib/admin/docTypes";
import { DEFAULT_LARK_PREFS, type LarkPrefs } from "@/lib/lark/prefs";
import { buildNamingSegments, todayYYYYMMDD } from "@/lib/admin/fileNaming";
import { useToastOnActionState } from "../useToastOnActionState";
import { Btn, inputClasses, labelClasses } from "../controls";

const initialState: LarkPrefsState = { error: null };

const VERSION_SELECT_OPTIONS = [
  { value: "", label: "Không đặt sẵn" },
  ...VERSION_OPTIONS.map((v) => ({ value: v, label: v })),
];

const TOGGLES: {
  key: keyof typeof DEFAULT_LARK_PREFS;
  label: string;
  hint: string;
  dot: string;
}[] = [
  {
    key: "includeDept",
    label: "Mã phòng ban",
    hint: "SAIZA-IT",
    dot: "#14B8A6",
  },
  {
    key: "includeDocType",
    label: "Loại tài liệu",
    hint: "Báo cáo, Kế hoạch…",
    dot: "#F59E0B",
  },
  { key: "includeDate", label: "Ngày tạo", hint: "YYYYMMDD", dot: "#3B82F6" },
  { key: "includeVersion", label: "Version", hint: "v1, v2…", dot: "#D946EF" },
];

// Shared form body for editing naming-convention prefs — used both inline
// (Overview tab card, no chrome) and inside LarkSettingsModal's drawer.
export function NamingSettingsPanel({
  prefs,
  department = null,
  footer,
  departments,
  orgCodes,
  docTypes,
}: {
  prefs: LarkPrefs;
  department?: string | null;
  footer?: (pending: boolean) => React.ReactNode;
  departments: ConfigOption[];
  orgCodes: ConfigOption[];
  docTypes: ConfigOption[];
}) {
  const [state, formAction, pending] = useActionState(
    updateLarkPrefs,
    initialState,
  );
  useToastOnActionState(
    state,
    state.success ? "Đã lưu quy ước đặt tên." : null,
  );
  const [toggles, setToggles] = useState({ ...DEFAULT_LARK_PREFS, ...prefs });
  const [defaultOrg, setDefaultOrg] = useState(prefs.defaultOrg ?? "");
  const [defaultVersion, setDefaultVersion] = useState(
    prefs.defaultVersion ?? "",
  );
  const [defaultDepartment, setDefaultDepartment] = useState(
    prefs.defaultDepartment ?? "",
  );
  const [defaultDocType, setDefaultDocType] = useState(
    prefs.defaultDocType ?? "",
  );
  const today = todayYYYYMMDD();

  const orgOptions = [
    { value: "", label: "Không đặt sẵn" },
    ...orgCodes.map((o) => ({ value: o.code, label: o.label })),
  ];
  const departmentOptions = [
    { value: "", label: "Theo hồ sơ nhân viên" },
    ...departments.map((d) => ({
      value: d.code,
      label: `${d.code} — ${d.label}`,
    })),
  ];
  const docTypeOptions = [
    { value: "", label: "Không đặt sẵn" },
    ...docTypes.map((d) => ({ value: d.code, label: d.label })),
  ];

  const segments = buildNamingSegments(
    {
      ...toggles,
      defaultOrg,
      defaultVersion,
      defaultDepartment,
      defaultDocType,
    },
    department,
    today,
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <NamingPreviewBox segments={segments} />

      <div className="flex flex-col gap-2">
        <h3 className={`${labelClasses} font-semibold text-ink`}>
          Thành phần tên file
        </h3>
        {TOGGLES.map((t) => (
          <div
            key={t.key}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-3"
            onClick={() =>
              setToggles((prev) => ({ ...prev, [t.key]: !prev[t.key] }))
            }
          >
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="h-[7px] w-[7px] flex-shrink-0 rounded-full"
                  style={{ background: t.dot }}
                />
                <span className="text-[13px] font-medium text-ink">
                  {t.label}
                </span>
              </div>
              <div className="mt-0.5 text-[12px] text-ink-2">{t.hint}</div>
            </div>
            <Toggle
              checked={toggles[t.key]}
              onChange={(v) => setToggles((prev) => ({ ...prev, [t.key]: v }))}
              name={t.key}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        <h3 className={`${labelClasses} font-semibold text-ink`}>
          Giá trị đặt sẵn
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelClasses}>Mã tổ chức</label>
            <Combobox
              name="defaultOrg"
              value={defaultOrg}
              options={orgOptions}
              onChange={setDefaultOrg}
              buttonClassName={`${inputClasses} flex items-center justify-between gap-2 text-left`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClasses}>Version</label>
            <Combobox
              name="defaultVersion"
              value={defaultVersion}
              options={VERSION_SELECT_OPTIONS}
              onChange={setDefaultVersion}
              buttonClassName={`${inputClasses} flex items-center justify-between gap-2 text-left`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClasses}>Phòng ban</label>
            <Combobox
              name="defaultDepartment"
              value={defaultDepartment}
              options={departmentOptions}
              onChange={setDefaultDepartment}
              buttonClassName={`${inputClasses} flex items-center justify-between gap-2 text-left`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClasses}>Loại tài liệu</label>
            <Combobox
              name="defaultDocType"
              value={defaultDocType}
              options={docTypeOptions}
              onChange={setDefaultDocType}
              buttonClassName={`${inputClasses} flex items-center justify-between gap-2 text-left`}
            />
          </div>
        </div>
      </div>

      {state.error && (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm font-medium text-accent-2">Đã lưu.</p>
      )}

      {footer ? (
        footer(pending)
      ) : (
        <Btn
          variant="primary"
          type="submit"
          disabled={pending}
          className="w-fit"
        >
          {pending ? "Đang lưu..." : "Lưu"}
        </Btn>
      )}
    </form>
  );
}
