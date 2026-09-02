"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { createLarkDocument, type LarkDocFormState } from "./actions";
import { Combobox } from "../Combobox";
import { LarkSettingsModal } from "./LarkSettingsModal";
import { useToastOnActionState } from "../useToastOnActionState";
import { StaffSharePicker, type StaffOption, type ShareRow } from "./StaffSharePicker";
import { DEPARTMENTS, ORG_CODES, departmentLabel } from "@/lib/admin/departments";
import { DOC_TYPES, VERSION_OPTIONS } from "@/lib/admin/docTypes";
import { buildFileName, buildFolderName, todayYYYYMMDD, dateInputToYYYYMMDD, MAX_FILENAME_LENGTH } from "@/lib/admin/fileNaming";
import { LARK_FILE_TYPE_LABELS, type LarkFileType } from "@/lib/lark/fileTypes";
import type { FolderOption } from "@/lib/lark/folders";
import { DEFAULT_LARK_PREFS, type LarkPrefs } from "@/lib/lark/prefs";

const initialState: LarkDocFormState = { error: null };
const fieldClasses =
  "rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14.5px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";
const labelClasses = "text-[11px] font-medium tracking-[0.06em] text-ink-2 uppercase";

const ORG_OPTIONS = [{ value: "", label: "Không riêng" }, ...ORG_CODES.map((o) => ({ value: o, label: o }))];
const DEPARTMENT_OPTIONS = DEPARTMENTS.map((d) => ({ value: d.code, label: `${d.code} — ${d.label}` }));
const DOC_TYPE_OPTIONS = [...DOC_TYPES.map((d) => ({ value: d.code, label: `${d.label} (${d.code})` })), { value: "Khác", label: "Khác…" }];
const VERSION_SELECT_OPTIONS = VERSION_OPTIONS.map((v) => ({ value: v, label: v }));

export function LarkDocForm({
  fileType,
  defaultDepartment,
  staff,
  foldersByOrg,
  prefs,
}: {
  fileType: LarkFileType;
  defaultDepartment: string | null;
  staff: StaffOption[];
  foldersByOrg: Record<string, FolderOption[]>;
  prefs: LarkPrefs;
}) {
  const [state, formAction, pending] = useActionState(createLarkDocument, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useToastOnActionState(state, state.title ? `Đã tạo "${state.title}".` : null);

  const [shareOpen, setShareOpen] = useState(false);
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [targetFolder, setTargetFolder] = useState("");
  const [org, setOrg] = useState(prefs.defaultOrg ?? "");
  const [department, setDepartment] = useState(defaultDepartment ?? prefs.defaultDepartment ?? "");
  const [docType, setDocType] = useState(prefs.defaultDocType ?? DOC_TYPES[0].code);
  const [docTypeOther, setDocTypeOther] = useState("");
  const [content, setContent] = useState("");
  const [dateInput, setDateInput] = useState(() => {
    const d = todayYYYYMMDD();
    return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  });
  const [version, setVersion] = useState<string>(prefs.defaultVersion ?? VERSION_OPTIONS[0]);
  const [wip, setWip] = useState(false);
  const [copied, setCopied] = useState(false);
  const [transferOwnership, setTransferOwnership] = useState(false);
  const [dismissedUrl, setDismissedUrl] = useState<string | null>(null);
  const [namingOpen, setNamingOpen] = useState(false);

  const [includeDept, setIncludeDept] = useState(prefs.includeDept ?? DEFAULT_LARK_PREFS.includeDept);
  const [includeDocType, setIncludeDocType] = useState(prefs.includeDocType ?? DEFAULT_LARK_PREFS.includeDocType);
  const [includeDate, setIncludeDate] = useState(prefs.includeDate ?? DEFAULT_LARK_PREFS.includeDate);
  const [includeVersion, setIncludeVersion] = useState(prefs.includeVersion ?? DEFAULT_LARK_PREFS.includeVersion);

  const autoDeptLabel = includeDept && department ? ` — thư mục ${departmentLabel(department) ?? department}` : "";
  const rootLabel = org
    ? `— Tự động (${org}${autoDeptLabel}) —`
    : autoDeptLabel
      ? `— Tự động (${departmentLabel(department) ?? department}) —`
      : "— Thư mục gốc (dùng chung) —";
  const FOLDER_OPTIONS = [
    { value: "", label: rootLabel },
    ...(foldersByOrg[org] ?? []).map((f) => ({ value: f.token, label: `${"　".repeat(f.depth - 1)}└ ${f.name}` })),
  ];

  const isFolder = fileType === "folder";
  const effectiveDocType = docType === "Khác" ? docTypeOther.trim() : docType;

  const duplicateFolder =
    isFolder && content.trim()
      ? (foldersByOrg[org] ?? []).find((f) => f.name.trim().toLowerCase() === content.trim().toLowerCase())
      : undefined;

  const preview = useMemo(() => {
    if (!content.trim()) return null;
    const dept = includeDept ? department || null : null;
    if (includeDept && !department) return null;
    if (isFolder) return buildFolderName({ org: org || null, department: dept, name: content });
    if (includeDocType && !effectiveDocType) return null;
    return buildFileName({
      org: org || null,
      department: dept,
      docType: includeDocType ? effectiveDocType || null : null,
      content,
      date: includeDate ? dateInputToYYYYMMDD(dateInput) : null,
      version: includeVersion ? version : null,
      wip,
    });
  }, [
    isFolder,
    org,
    department,
    includeDept,
    effectiveDocType,
    includeDocType,
    content,
    dateInput,
    includeDate,
    version,
    includeVersion,
    wip,
  ]);

  const previewTooLong = preview !== null && preview.length > MAX_FILENAME_LENGTH;

  return (
    <div className="flex flex-col gap-3">
      <form
        ref={formRef}
        action={(formData) => formAction(formData)}
        className="flex flex-col gap-4 rounded-card border border-line bg-card p-5"
      >
        <input type="hidden" name="fileType" value={fileType} />
        <div className="flex flex-col gap-1.5">
          <label className={labelClasses}>Tạo trong thư mục</label>
          <Combobox
            name="targetFolder"
            value={targetFolder}
            options={FOLDER_OPTIONS}
            onChange={setTargetFolder}
            buttonClassName={`${fieldClasses} flex w-full items-center justify-between gap-2 text-left`}
          />
          {!targetFolder && includeDept && department && (
            <p className="text-xs text-ink-2">
              Để trống sẽ tự động vào đúng thư mục phòng ban {departmentLabel(department) ?? department}, tạo sẵn nếu chưa có.
            </p>
          )}
        </div>

        <div className={`grid gap-3 ${isFolder ? "grid-cols-2" : "grid-cols-3"}`}>
          <div className="flex flex-col gap-1.5">
            <label className={labelClasses}>Mã tổ chức</label>
            <Combobox
              name="org"
              value={org}
              options={ORG_OPTIONS}
              onChange={(v) => {
                setOrg(v);
                setTargetFolder("");
              }}
              buttonClassName={`${fieldClasses} flex w-full items-center justify-between gap-2 text-left`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={`${labelClasses} flex items-center gap-1.5`}>
              <input
                type="checkbox"
                name="includeDept"
                checked={includeDept}
                onChange={(e) => setIncludeDept(e.target.checked)}
                className="h-3 w-3 accent-accent"
              />
              Phòng ban
            </label>
            {includeDept ? (
              <Combobox
                name="department"
                value={department}
                options={DEPARTMENT_OPTIONS}
                onChange={setDepartment}
                buttonClassName={`${fieldClasses} flex w-full items-center justify-between gap-2 text-left`}
              />
            ) : (
              <div className={`${fieldClasses} text-ink-2/50`}>Không đưa vào tên file</div>
            )}
          </div>
          {!isFolder && (
            <div className="flex flex-col gap-1.5">
              <label className={`${labelClasses} flex items-center gap-1.5`}>
                <input
                  type="checkbox"
                  name="includeDocType"
                  checked={includeDocType}
                  onChange={(e) => setIncludeDocType(e.target.checked)}
                  className="h-3 w-3 accent-accent"
                />
                Loại tài liệu
              </label>
              {includeDocType ? (
                <Combobox
                  name="docType"
                  value={docType}
                  options={DOC_TYPE_OPTIONS}
                  onChange={setDocType}
                  buttonClassName={`${fieldClasses} flex w-full items-center justify-between gap-2 text-left`}
                />
              ) : (
                <div className={`${fieldClasses} text-ink-2/50`}>Không đưa vào tên file</div>
              )}
            </div>
          )}
        </div>
        {includeDept && !defaultDepartment && (
          <p className="-mt-1.5 text-xs text-amber-700">
            Hồ sơ của bạn chưa gán phòng ban cố định — chọn tạm ở đây, hoặc báo Quản trị vào Nhân sự để gán.
          </p>
        )}

        {!isFolder && docType === "Khác" && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="docTypeOther" className={labelClasses}>
              Loại tài liệu (tự nhập)
            </label>
            <input
              id="docTypeOther"
              name="docTypeOther"
              value={docTypeOther}
              onChange={(e) => setDocTypeOther(e.target.value)}
              placeholder="Ví dụ: Đề Xuất"
              className={fieldClasses}
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="content" className={labelClasses}>
            {isFolder ? "Tên thư mục" : "Nội dung / dự án"}
          </label>
          <input
            id="content"
            name="content"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={isFolder ? "Ví dụ: Hợp đồng khách hàng" : "Ví dụ: Chiến dịch Q3"}
            className={fieldClasses}
          />
          {duplicateFolder && (
            <p className="text-xs font-medium text-amber-700">
              Đã có thư mục tên này trong cây thư mục — cân nhắc dùng lại (chọn ở &quot;Tạo trong thư mục&quot;) thay vì tạo trùng.
            </p>
          )}
        </div>

        {!isFolder && (
          <div className="grid grid-cols-3 items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={`${labelClasses} flex items-center gap-1.5`}>
                <input
                  type="checkbox"
                  name="includeVersion"
                  checked={includeVersion}
                  onChange={(e) => setIncludeVersion(e.target.checked)}
                  className="h-3 w-3 accent-accent"
                />
                Version
              </label>
              {includeVersion ? (
                <Combobox
                  name="version"
                  value={version}
                  options={VERSION_SELECT_OPTIONS}
                  onChange={setVersion}
                  buttonClassName={`${fieldClasses} flex w-full items-center justify-between gap-2 text-left`}
                />
              ) : (
                <div className={`${fieldClasses} text-ink-2/50`}>Không đưa vào tên file</div>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="date" className={`${labelClasses} flex items-center gap-1.5`}>
                <input
                  type="checkbox"
                  name="includeDate"
                  checked={includeDate}
                  onChange={(e) => setIncludeDate(e.target.checked)}
                  className="h-3 w-3 accent-accent"
                />
                Ngày
              </label>
              {includeDate ? (
                <input id="date" type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} className={fieldClasses} />
              ) : (
                <div className={`${fieldClasses} text-ink-2/50`}>Không đưa vào tên file</div>
              )}
            </div>
            <label className="flex items-center gap-2 pb-2.5">
              <input
                type="checkbox"
                name="wip"
                checked={wip}
                onChange={(e) => setWip(e.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              <span className="text-[13px] text-ink-2">WIP (đang soạn)</span>
            </label>
          </div>
        )}

        {!isFolder && includeDate && <input type="hidden" name="date" value={dateInputToYYYYMMDD(dateInput)} />}

        <div className="flex items-center gap-2 rounded-xl border border-line bg-wash px-3.5 py-2.5">
          <span className="min-w-0 flex-1 truncate font-mono text-[13.5px] text-ink">{preview ?? "— điền đủ các mục ở trên —"}</span>
          {preview && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(preview);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="flex-shrink-0 cursor-pointer text-xs font-semibold text-accent hover:text-ink"
            >
              {copied ? "Đã chép" : "Chép"}
            </button>
          )}
        </div>
        {previewTooLong && (
          <p className="-mt-2 text-xs font-medium text-red-600">
            Tên dài {preview?.length} ký tự, vượt giới hạn {MAX_FILENAME_LENGTH}. Rút ngắn phần nội dung.
          </p>
        )}

        <button
          type="button"
          onClick={() => setNamingOpen(true)}
          className="w-fit cursor-pointer text-xs font-semibold text-accent hover:text-ink"
        >
          Sửa quy ước tên
        </button>

        <label className="flex items-start gap-2.5 rounded-xl border border-line px-3.5 py-2.5">
          <input
            type="checkbox"
            name="transferOwnership"
            checked={transferOwnership}
            onChange={(e) => setTransferOwnership(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0 accent-accent"
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-[13.5px] font-medium text-ink">Chuyển quyền sở hữu cho tôi</span>
            <span className="text-xs text-ink-2">
              Cho phép bạn tự xoá/đổi tên trực tiếp trong Lark. Đổi lại, nút &quot;Xoá&quot;/&quot;Di chuyển&quot; trên trang web này sẽ
              không dùng được cho file/thư mục này nữa.
            </span>
          </span>
        </label>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShareOpen((o) => !o)}
            className="flex w-fit cursor-pointer items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-300 ease-soft ${shareOpen ? "rotate-90" : ""}`}
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
            Chia sẻ thêm với {shares.length > 0 && `(${shares.length})`}
          </button>
          {shareOpen && (
            <div className="rounded-xl border border-line bg-paper p-3">
              <p className="mb-2.5 text-xs text-ink-2">Bạn (người tạo) luôn tự động có toàn quyền.</p>
              <StaffSharePicker staff={staff} hiddenFieldName="shares" value={shares} onChange={setShares} />
            </div>
          )}
        </div>

        {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending || !preview}
          className="w-fit cursor-pointer rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Đang tạo..." : `Tạo ${LARK_FILE_TYPE_LABELS[fileType]}`}
        </button>
      </form>

      <LarkSettingsModal prefs={prefs} department={department || defaultDepartment} open={namingOpen} onOpenChange={setNamingOpen} />

      {state.url && state.url !== dismissedUrl && (
        <div className="flex flex-col gap-2.5 rounded-card border border-line bg-card p-4">
          <span className="text-sm font-semibold">Đã tạo &quot;{state.title}&quot;</span>
          <a href={state.url} target="_blank" rel="noreferrer" className="text-sm text-accent underline break-all">
            {state.url}
          </a>
          {state.shareResults && state.shareResults.length > 0 && (
            <div className="flex flex-col gap-1 border-t border-line pt-3">
              {state.shareResults.map((r) => (
                <span key={r.email} className="text-xs text-ink-2">
                  {r.ok ? "✓" : "✗"} {r.email} {r.ok ? "" : "— chia sẻ thất bại, có thể chưa có tài khoản Lark"}
                </span>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setDismissedUrl(state.url ?? null);
              setContent("");
            }}
            className="w-fit cursor-pointer text-xs font-semibold text-accent hover:text-ink"
          >
            + Tạo file khác
          </button>
        </div>
      )}
    </div>
  );
}
