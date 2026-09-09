"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import {
  createLarkDocument,
  saveLarkNamingTemplate,
  deleteLarkNamingTemplate,
  type LarkDocFormState,
} from "./actions";
import { Combobox } from "../Combobox";
import { LarkSettingsModal } from "./LarkSettingsModal";
import { useToastOnActionState } from "../useToastOnActionState";
import {
  StaffSharePicker,
  type StaffOption,
  type ShareRow,
} from "./StaffSharePicker";
import {
  resolveConfigLabel,
  type ConfigOption,
} from "@/lib/admin/configListHelpers";
import { VERSION_OPTIONS } from "@/lib/admin/docTypes";
import {
  buildFileName,
  buildFolderName,
  sanitizeNameSegment,
  todayYYYYMMDD,
  dateInputToYYYYMMDD,
  MAX_FILENAME_LENGTH,
} from "@/lib/admin/fileNaming";
import { LARK_FILE_TYPE_LABELS, type LarkFileType } from "@/lib/lark/fileTypes";
import type { FolderOption } from "@/lib/lark/folders";
import {
  DEFAULT_LARK_PREFS,
  type LarkPrefs,
  type LarkNamingTemplate,
} from "@/lib/lark/prefs";
import { Toggle } from "./Toggle";
import {
  Btn,
  btnClasses,
  inputClasses,
  labelClasses,
  cardClasses,
} from "../controls";

const initialState: LarkDocFormState = { error: null };

/**
 * Placeholder for a naming component whose toggle is off. Was the sentence
 * "Không đưa vào tên file", repeated in all four slots — four full-width
 * boxes of prose restating what the switch beside them already says. An
 * em dash keeps the grid rows the same height (so nothing jumps when a
 * switch flips) while saying it in one glyph.
 */
function OffField() {
  return (
    <div
      className={`${inputClasses} flex items-center text-ink-2/40`}
      aria-hidden
    >
      —
    </div>
  );
}

/** Label + its on/off switch, on one row above the field it controls. */
function FieldToggleLabel({
  label,
  htmlFor,
  checked,
  onChange,
  name,
}: {
  label: string;
  htmlFor?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  name: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <label htmlFor={htmlFor} className={labelClasses}>
        {label}
      </label>
      <Toggle checked={checked} onChange={onChange} name={name} />
    </div>
  );
}
const VERSION_SELECT_OPTIONS = VERSION_OPTIONS.map((v) => ({
  value: v,
  label: v,
}));

export function LarkDocForm({
  fileType,
  defaultDepartment,
  staff,
  foldersByOrg,
  prefs,
  departments,
  orgCodes,
  docTypes,
}: {
  fileType: LarkFileType;
  defaultDepartment: string | null;
  staff: StaffOption[];
  foldersByOrg: Record<string, FolderOption[]>;
  prefs: LarkPrefs;
  departments: ConfigOption[];
  orgCodes: ConfigOption[];
  docTypes: ConfigOption[];
}) {
  const [state, formAction, pending] = useActionState(
    createLarkDocument,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  useToastOnActionState(state, state.title ? `Đã tạo "${state.title}".` : null);

  const ORG_OPTIONS = [
    { value: "", label: "Không riêng" },
    ...orgCodes.map((o) => ({ value: o.code, label: o.label })),
  ];
  const DEPARTMENT_OPTIONS = departments.map((d) => ({
    value: d.code,
    label: `${d.code} — ${d.label}`,
  }));
  const DOC_TYPE_OPTIONS = [
    ...docTypes.map((d) => ({
      value: d.code,
      label: `${d.label} (${d.code})`,
    })),
    { value: "Khác", label: "Khác…" },
  ];

  const [shareOpen, setShareOpen] = useState(false);
  const [shares, setShares] = useState<ShareRow[]>([]);
  const [targetFolder, setTargetFolder] = useState("");
  const [org, setOrg] = useState(prefs.defaultOrg ?? "");
  const [department, setDepartment] = useState(
    defaultDepartment ?? prefs.defaultDepartment ?? "",
  );
  const [docType, setDocType] = useState(
    prefs.defaultDocType ?? docTypes[0]?.code ?? "",
  );
  const [docTypeOther, setDocTypeOther] = useState("");
  const [content, setContent] = useState("");
  const [dateInput, setDateInput] = useState(() => {
    const d = todayYYYYMMDD();
    return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  });
  const [version, setVersion] = useState<string>(
    prefs.defaultVersion ?? VERSION_OPTIONS[0],
  );
  const [wip, setWip] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dismissedUrl, setDismissedUrl] = useState<string | null>(null);
  const [namingOpen, setNamingOpen] = useState(false);

  const [includeDept, setIncludeDept] = useState(
    prefs.includeDept ?? DEFAULT_LARK_PREFS.includeDept,
  );
  const [includeDocType, setIncludeDocType] = useState(
    prefs.includeDocType ?? DEFAULT_LARK_PREFS.includeDocType,
  );
  const [includeDate, setIncludeDate] = useState(
    prefs.includeDate ?? DEFAULT_LARK_PREFS.includeDate,
  );
  const [includeVersion, setIncludeVersion] = useState(
    prefs.includeVersion ?? DEFAULT_LARK_PREFS.includeVersion,
  );

  // "Đặt tên tự do" — popup-local only, never persisted (unlike the toggles
  // above, which seed from and can be saved back into lark_prefs). Bypasses
  // the whole naming-convention block below; `content` becomes the literal
  // title instead of a piece of it.
  const [namingMode, setNamingMode] = useState<"structured" | "custom">(
    "structured",
  );

  // Saved naming-convention presets (see LarkNamingTemplate) — local copy so
  // saving/deleting updates the picker immediately without waiting on a
  // full page revalidate.
  const [templates, setTemplates] = useState<LarkNamingTemplate[]>(
    prefs.templates ?? [],
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);

  function applyTemplate(t: LarkNamingTemplate) {
    setOrg(t.org);
    setDepartment(t.department);
    setDocType(t.docType);
    setDocTypeOther("");
    setVersion(t.version);
    setIncludeDept(t.includeDept);
    setIncludeDocType(t.includeDocType);
    setIncludeDate(t.includeDate);
    setIncludeVersion(t.includeVersion);
    setWip(t.wip);
  }

  async function handleSaveTemplate() {
    const name = newTemplateName.trim();
    if (!name) return;
    setSavingTemplate(true);
    setTemplateError(null);
    const res = await saveLarkNamingTemplate({
      name,
      includeDept,
      includeDocType,
      includeDate,
      includeVersion,
      org,
      department,
      docType,
      version,
      wip,
    });
    setSavingTemplate(false);
    if (res.error) {
      setTemplateError(res.error);
      return;
    }
    if (res.template) {
      setTemplates((prev) => [...prev, res.template as LarkNamingTemplate]);
      setSelectedTemplateId(res.template.id);
    }
    setNewTemplateName("");
    setShowSaveTemplate(false);
  }

  async function handleDeleteTemplate(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (selectedTemplateId === id) setSelectedTemplateId("");
    await deleteLarkNamingTemplate(id);
  }

  const autoDeptLabel =
    includeDept && department
      ? ` — thư mục ${resolveConfigLabel(department, departments) ?? department}`
      : "";
  const rootLabel = org
    ? `— Tự động (${org}${autoDeptLabel}) —`
    : autoDeptLabel
      ? `— Tự động (${resolveConfigLabel(department, departments) ?? department}) —`
      : "— Thư mục gốc (dùng chung) —";
  const FOLDER_OPTIONS = [
    { value: "", label: rootLabel },
    ...(foldersByOrg[org] ?? []).map((f) => ({
      value: f.token,
      label: `${"　".repeat(f.depth - 1)}└ ${f.name}`,
    })),
  ];

  const isFolder = fileType === "folder";
  const effectiveDocType = docType === "Khác" ? docTypeOther.trim() : docType;

  const duplicateFolder =
    isFolder && content.trim()
      ? (foldersByOrg[org] ?? []).find(
          (f) => f.name.trim().toLowerCase() === content.trim().toLowerCase(),
        )
      : undefined;

  const preview = useMemo(() => {
    if (!content.trim()) return null;
    if (namingMode === "custom") return sanitizeNameSegment(content) || null;
    const dept = includeDept ? department || null : null;
    if (includeDept && !department) return null;
    if (isFolder)
      return buildFolderName({
        org: org || null,
        department: dept,
        name: content,
      });
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
    namingMode,
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

  const previewTooLong =
    preview !== null && preview.length > MAX_FILENAME_LENGTH;

  return (
    <div className="flex flex-col gap-3">
      <form
        ref={formRef}
        action={(formData) => formAction(formData)}
        className="flex flex-col gap-5"
      >
        <input type="hidden" name="fileType" value={fileType} />
        <input type="hidden" name="namingMode" value={namingMode} />

        {/* 1. Cái đầu tiên người dùng thật sự nghĩ tới: nội dung là gì —
            trước cả việc nó tên gì theo quy ước hay nằm ở thư mục nào. */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="content" className={labelClasses}>
            {namingMode === "custom"
              ? "Tên file"
              : isFolder
                ? "Tên thư mục"
                : "Nội dung / dự án"}
          </label>
          <input
            id="content"
            name="content"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              namingMode === "custom"
                ? "Đặt tên tuỳ ý"
                : isFolder
                  ? "Ví dụ: Hợp đồng khách hàng"
                  : "Ví dụ: Chiến dịch Q3"
            }
            className={inputClasses}
          />
          {duplicateFolder && (
            <p className="text-xs font-medium text-amber-700">
              Đã có thư mục trùng tên — cân nhắc dùng lại thư mục đó.
            </p>
          )}
        </div>

        {/* 2. Mọi thứ ảnh hưởng tới TÊN FILE gộp chung một khối — mỗi ô tuỳ
            chọn (Phòng ban/Loại tài liệu/Version/Ngày) có công tắc bật/tắt
            ngay trên đầu ô. Bật "Đặt tên tự do" thu gọn cả khối này lại chỉ
            còn hàng tiêu đề: chế độ đó không dùng quy ước nào cả, nên không
            có gì để hiển thị. Chỉ áp dụng cho lần tạo này, không lưu thành
            mặc định. */}
        <div className="flex flex-col gap-3.5 rounded-xl border border-line bg-paper/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-semibold text-ink">Quy ước tên</p>
            <div className="flex items-center gap-2">
              {namingMode === "structured" && (
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={() => setNamingOpen(true)}
                >
                  Sửa quy ước
                </Btn>
              )}
              <label className="flex cursor-pointer items-center gap-2 pl-1">
                <span className="text-[13px] text-ink-2">Đặt tên tự do</span>
                <Toggle
                  checked={namingMode === "custom"}
                  onChange={(checked) =>
                    setNamingMode(checked ? "custom" : "structured")
                  }
                />
              </label>
            </div>
          </div>

          {namingMode === "structured" && (
            <>
              {templates.length > 0 && (
                <div className="flex items-end gap-2">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <label className={labelClasses}>Mẫu đã lưu</label>
                    <Combobox
                      value={selectedTemplateId}
                      options={[
                        { value: "", label: "— Chọn mẫu —" },
                        ...templates.map((t) => ({
                          value: t.id,
                          label: t.name,
                        })),
                      ]}
                      onChange={(id) => {
                        setSelectedTemplateId(id);
                        const t = templates.find((tt) => tt.id === id);
                        if (t) applyTemplate(t);
                      }}
                      buttonClassName={`${inputClasses} flex items-center justify-between gap-2 text-left`}
                    />
                  </div>
                  {selectedTemplateId && (
                    <Btn
                      variant="danger"
                      size="md"
                      onClick={() => handleDeleteTemplate(selectedTemplateId)}
                    >
                      Xoá
                    </Btn>
                  )}
                </div>
              )}

              <div
                className={`grid gap-3 ${isFolder ? "grid-cols-2" : "grid-cols-3"}`}
              >
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
                    buttonClassName={`${inputClasses} flex items-center justify-between gap-2 text-left`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <FieldToggleLabel
                    label="Phòng ban"
                    checked={includeDept}
                    onChange={setIncludeDept}
                    name="includeDept"
                  />
                  {includeDept ? (
                    <Combobox
                      name="department"
                      value={department}
                      options={DEPARTMENT_OPTIONS}
                      onChange={setDepartment}
                      buttonClassName={`${inputClasses} flex items-center justify-between gap-2 text-left`}
                    />
                  ) : (
                    <OffField />
                  )}
                </div>
                {!isFolder && (
                  <div className="flex flex-col gap-1.5">
                    <FieldToggleLabel
                      label="Loại tài liệu"
                      checked={includeDocType}
                      onChange={setIncludeDocType}
                      name="includeDocType"
                    />
                    {includeDocType ? (
                      <Combobox
                        name="docType"
                        value={docType}
                        options={DOC_TYPE_OPTIONS}
                        onChange={setDocType}
                        buttonClassName={`${inputClasses} flex items-center justify-between gap-2 text-left`}
                      />
                    ) : (
                      <OffField />
                    )}
                  </div>
                )}
              </div>
              {includeDept && !defaultDepartment && (
                <p className="text-xs text-amber-700">
                  Hồ sơ chưa gán phòng ban — chọn tạm ở đây.
                </p>
              )}

              {!isFolder && docType === "Khác" && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="docTypeOther" className={labelClasses}>
                    Loại tài liệu
                  </label>
                  <input
                    id="docTypeOther"
                    name="docTypeOther"
                    value={docTypeOther}
                    onChange={(e) => setDocTypeOther(e.target.value)}
                    placeholder="Ví dụ: Đề Xuất"
                    className={inputClasses}
                  />
                </div>
              )}

              {!isFolder && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <FieldToggleLabel
                      label="Version"
                      checked={includeVersion}
                      onChange={setIncludeVersion}
                      name="includeVersion"
                    />
                    {includeVersion ? (
                      <Combobox
                        name="version"
                        value={version}
                        options={VERSION_SELECT_OPTIONS}
                        onChange={setVersion}
                        buttonClassName={`${inputClasses} flex items-center justify-between gap-2 text-left`}
                      />
                    ) : (
                      <OffField />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <FieldToggleLabel
                      label="Ngày"
                      htmlFor="date"
                      checked={includeDate}
                      onChange={setIncludeDate}
                      name="includeDate"
                    />
                    {includeDate ? (
                      <input
                        id="date"
                        type="date"
                        value={dateInput}
                        onChange={(e) => setDateInput(e.target.value)}
                        className={inputClasses}
                      />
                    ) : (
                      <OffField />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={labelClasses}>WIP</label>
                    <label
                      className={`${inputClasses} flex cursor-pointer items-center justify-between gap-2`}
                    >
                      <span className="truncate text-ink-2">Đang soạn</span>
                      <Toggle checked={wip} onChange={setWip} name="wip" />
                    </label>
                  </div>
                </div>
              )}

              {showSaveTemplate ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="Tên mẫu — ví dụ: Báo cáo tuần KT"
                      className={inputClasses}
                    />
                    <Btn
                      variant="primary"
                      disabled={savingTemplate || !newTemplateName.trim()}
                      onClick={handleSaveTemplate}
                    >
                      {savingTemplate ? "Đang lưu..." : "Lưu"}
                    </Btn>
                    <Btn
                      variant="ghost"
                      onClick={() => {
                        setShowSaveTemplate(false);
                        setNewTemplateName("");
                        setTemplateError(null);
                      }}
                    >
                      Huỷ
                    </Btn>
                  </div>
                  {templateError && (
                    <p className="text-xs font-medium text-red-600">
                      {templateError}
                    </p>
                  )}
                </div>
              ) : (
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSaveTemplate(true)}
                  className="w-fit"
                >
                  Lưu làm mẫu
                </Btn>
              )}
            </>
          )}
        </div>

        {!isFolder && includeDate && (
          <input
            type="hidden"
            name="date"
            value={dateInputToYYYYMMDD(dateInput)}
          />
        )}

        {/* 3. Xem trước — hệ quả trực tiếp của khối phía trên, đặt ngay sau
            để so sánh tại chỗ mỗi khi bật/tắt một ô. */}
        <div className="flex items-center gap-2 rounded-lg border border-line bg-wash pr-1.5 pl-3.5">
          <span className="min-w-0 flex-1 truncate py-2.5 font-mono text-[13.5px] text-ink">
            {preview ?? "— chưa đủ thông tin —"}
          </span>
          {preview && (
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(preview);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? "Đã chép" : "Chép"}
            </Btn>
          )}
        </div>
        {previewTooLong && (
          <p className="-mt-2.5 text-xs font-medium text-red-600">
            Tên dài {preview?.length}/{MAX_FILENAME_LENGTH} ký tự — rút ngắn nội
            dung.
          </p>
        )}

        {/* 4. Việc sau cùng cần quyết định: file này lưu ở đâu, ai được đụng
            vào nó — tách khỏi khối đặt tên vì đây là hai câu hỏi khác nhau. */}
        <div className="flex flex-col gap-3.5 rounded-xl border border-line p-4">
          <p className="text-[13px] font-semibold text-ink">
            Lưu trữ &amp; chia sẻ
          </p>

          <div className="flex flex-col gap-1.5">
            <label className={labelClasses}>Thư mục</label>
            <Combobox
              name="targetFolder"
              value={targetFolder}
              options={FOLDER_OPTIONS}
              onChange={setTargetFolder}
              buttonClassName={`${inputClasses} flex items-center justify-between gap-2 text-left`}
            />
            {!targetFolder && includeDept && department && (
              <p className="text-xs text-ink-2">
                Tự vào thư mục{" "}
                {resolveConfigLabel(department, departments) ?? department}.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => setShareOpen((o) => !o)}
              className="w-fit"
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
                className={`transition-transform duration-150 ${shareOpen ? "rotate-90" : ""}`}
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
              Chia sẻ thêm{shares.length > 0 && ` (${shares.length})`}
            </Btn>
            {shareOpen && (
              <div className="rounded-xl border border-line bg-paper p-3">
                <StaffSharePicker
                  staff={staff}
                  hiddenFieldName="shares"
                  value={shares}
                  onChange={setShares}
                />
              </div>
            )}
          </div>
        </div>

        {state.error && (
          <p className="text-sm font-medium text-red-600">{state.error}</p>
        )}
        <Btn
          variant="primary"
          type="submit"
          disabled={pending || !preview}
          className="w-fit"
        >
          {pending ? "Đang tạo..." : `Tạo ${LARK_FILE_TYPE_LABELS[fileType]}`}
        </Btn>
      </form>

      <LarkSettingsModal
        prefs={prefs}
        department={department || defaultDepartment}
        open={namingOpen}
        onOpenChange={setNamingOpen}
        departments={departments}
        orgCodes={orgCodes}
        docTypes={docTypes}
      />

      {state.url && state.url !== dismissedUrl && (
        <div className={`flex flex-col gap-3 ${cardClasses} p-4`}>
          <span className="text-sm font-medium text-ink">
            Đã tạo {state.title}
          </span>
          {/* The raw URL used to be printed in full as an underlined link —
              a 60-character token nobody reads, in place of the one control
              they actually want. An anchor styled as a button: still a real
              link (middle-click / open-in-new-tab keep working), but it
              looks like the action it is. */}
          <div className="flex flex-wrap gap-2">
            <a
              href={state.url}
              target="_blank"
              rel="noreferrer"
              className={btnClasses("primary", "md")}
            >
              Mở trong Lark
            </a>
            <Btn
              onClick={() => {
                setDismissedUrl(state.url ?? null);
                setContent("");
              }}
            >
              Tạo file khác
            </Btn>
          </div>
          {state.shareResults && state.shareResults.length > 0 && (
            <div className="flex flex-col gap-1 border-t border-line pt-3">
              {state.shareResults.map((r) => (
                <span key={r.email} className="text-xs text-ink-2">
                  {r.ok ? "✓" : "✗"} {r.email}
                  {!r.ok && " — chưa có tài khoản Lark?"}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
