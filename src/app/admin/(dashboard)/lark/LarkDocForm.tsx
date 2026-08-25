"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { createLarkDocument, type LarkDocFormState } from "./actions";
import { Combobox } from "../Combobox";
import { DEPARTMENTS, ORG_CODES } from "@/lib/admin/departments";
import { DOC_TYPES, VERSION_OPTIONS } from "@/lib/admin/docTypes";
import { buildFileName, todayYYYYMMDD, dateInputToYYYYMMDD, MAX_FILENAME_LENGTH } from "@/lib/admin/fileNaming";

const initialState: LarkDocFormState = { error: null };
const fieldClasses =
  "rounded-[14px] border border-line bg-paper px-4 py-3 text-[15px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

const ORG_OPTIONS = [{ value: "", label: "Không — dùng chung toàn hệ thống" }, ...ORG_CODES.map((o) => ({ value: o, label: o }))];
const DEPARTMENT_OPTIONS = DEPARTMENTS.map((d) => ({ value: d.code, label: `${d.code} — ${d.label}` }));
const DOC_TYPE_OPTIONS = [...DOC_TYPES.map((d) => ({ value: d.code, label: `${d.label} (${d.code})` })), { value: "Khác", label: "Khác…" }];
const VERSION_SELECT_OPTIONS = VERSION_OPTIONS.map((v) => ({ value: v, label: v }));

export function LarkDocForm({ defaultDepartment }: { defaultDepartment: string | null }) {
  const [state, formAction, pending] = useActionState(createLarkDocument, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const [org, setOrg] = useState("");
  const [department, setDepartment] = useState(defaultDepartment ?? "");
  const [docType, setDocType] = useState(DOC_TYPES[0].code);
  const [docTypeOther, setDocTypeOther] = useState("");
  const [content, setContent] = useState("");
  const [dateInput, setDateInput] = useState(() => {
    const d = todayYYYYMMDD();
    return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  });
  const [version, setVersion] = useState<string>(VERSION_OPTIONS[0]);
  const [wip, setWip] = useState(false);

  const effectiveDocType = docType === "Khác" ? docTypeOther.trim() : docType;

  const preview = useMemo(() => {
    if (!department || !effectiveDocType || !content.trim()) return null;
    return buildFileName({
      org: org || null,
      department,
      docType: effectiveDocType,
      content,
      date: dateInputToYYYYMMDD(dateInput),
      version,
      wip,
    });
  }, [org, department, effectiveDocType, content, dateInput, version, wip]);

  const previewTooLong = preview !== null && preview.length > MAX_FILENAME_LENGTH;

  return (
    <div className="flex max-w-[640px] flex-col gap-4">
      <form
        ref={formRef}
        action={(formData) => {
          formAction(formData);
        }}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs tracking-[0.1em] text-ink-2 uppercase">Mã tổ chức (nếu riêng)</label>
            <Combobox
              name="org"
              value={org}
              options={ORG_OPTIONS}
              onChange={setOrg}
              buttonClassName={`${fieldClasses} flex w-full items-center justify-between gap-2 text-left`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs tracking-[0.1em] text-ink-2 uppercase">Phòng ban</label>
            <Combobox
              name="department"
              value={department}
              options={DEPARTMENT_OPTIONS}
              onChange={setDepartment}
              buttonClassName={`${fieldClasses} flex w-full items-center justify-between gap-2 text-left`}
            />
            {!defaultDepartment && (
              <p className="text-xs text-amber-700">
                Hồ sơ của bạn chưa được gán phòng ban cố định — chọn tạm ở đây, hoặc báo Quản trị vào Nhân sự để gán.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs tracking-[0.1em] text-ink-2 uppercase">Loại tài liệu</label>
            <Combobox
              name="docType"
              value={docType}
              options={DOC_TYPE_OPTIONS}
              onChange={setDocType}
              buttonClassName={`${fieldClasses} flex w-full items-center justify-between gap-2 text-left`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs tracking-[0.1em] text-ink-2 uppercase">Version</label>
            <Combobox
              name="version"
              value={version}
              options={VERSION_SELECT_OPTIONS}
              onChange={setVersion}
              buttonClassName={`${fieldClasses} flex w-full items-center justify-between gap-2 text-left`}
            />
          </div>
        </div>

        {docType === "Khác" && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="docTypeOther" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
              Loại tài liệu (tự nhập)
            </label>
            <input
              id="docTypeOther"
              name="docTypeOther"
              value={docTypeOther}
              onChange={(e) => setDocTypeOther(e.target.value)}
              placeholder="Ví dụ: ĐềXuất"
              className={fieldClasses}
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="content" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
            Nội dung / dự án
          </label>
          <input
            id="content"
            name="content"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ví dụ: Chiến dịch Q3"
            className={fieldClasses}
          />
          <p className="text-xs text-ink-2">Mô tả ngắn gọn — khoảng trắng sẽ tự chuyển thành PascalCase khi ghép tên.</p>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="date" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
              Ngày
            </label>
            <input
              id="date"
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className={fieldClasses}
            />
          </div>
          <label className="flex items-center gap-2.5 self-end pb-3">
            <input
              type="checkbox"
              name="wip"
              checked={wip}
              onChange={(e) => setWip(e.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            <span className="text-sm text-ink-2">Đang soạn (thêm tiền tố WIP_)</span>
          </label>
        </div>

        <input type="hidden" name="date" value={dateInputToYYYYMMDD(dateInput)} />

        <div className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-wash px-4 py-3.5">
          <span className="text-xs tracking-[0.1em] text-ink-2 uppercase">Tên file sẽ tạo</span>
          <span className="font-mono text-[15px] break-all text-ink">{preview ?? "— điền đủ các mục ở trên —"}</span>
          {previewTooLong && (
            <span className="text-xs font-medium text-red-600">
              Tên dài {preview?.length} ký tự, vượt giới hạn khuyến nghị {MAX_FILENAME_LENGTH}. Rút ngắn phần nội dung.
            </span>
          )}
        </div>

        {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending || !preview}
          className="w-fit cursor-pointer rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Đang tạo..." : "Tạo tài liệu Lark"}
        </button>
      </form>

      {state.url && (
        <div className="flex flex-col gap-1.5 rounded-card border border-line bg-card p-5">
          <span className="text-sm font-semibold">Đã tạo &quot;{state.title}&quot;</span>
          <a href={state.url} target="_blank" rel="noreferrer" className="text-sm text-accent underline break-all">
            {state.url}
          </a>
        </div>
      )}
    </div>
  );
}
