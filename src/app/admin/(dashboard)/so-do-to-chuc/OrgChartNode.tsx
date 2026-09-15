"use client";

import { useState } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Avatar } from "../Avatar";
import { PeoplePicker } from "../lark/PeoplePicker";
import type { StaffOption } from "../lark/StaffSharePicker";
import { Btn, inputClasses } from "../controls";
import { NODE_COLOR_PRESETS, contrastText } from "./colors";
import type { OrgChartMember } from "./data";
import type { OrgContact } from "@/lib/lark/contactsCache";

export type OrgNodeData = {
  label: string;
  color: string;
  members: OrgChartMember[];
  canEdit: boolean;
  contacts: OrgContact[];
  onRename: (id: string, label: string, color: string) => void;
  onDelete: (id: string) => void;
  onAddMember: (nodeId: string, contact: StaffOption) => void;
  onRemoveMember: (memberId: string) => void;
};

export type OrgFlowNode = Node<OrgNodeData, "orgNode">;

// A box on the canvas — its own height grows/shrinks as members expand or
// an edit form opens; React Flow (v12) auto-measures unstyled dimensions
// via ResizeObserver, so edges reroute on their own without any manual
// "tell React Flow this node resized" call.
export function OrgChartNode({ id, data, selected }: NodeProps<OrgFlowNode>) {
  // Always open by default — a box with its member list hidden reads as
  // "empty" at a glance, which defeats the point of an org chart. Still
  // collapsible per-box for anyone who wants to declutter their own view.
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [labelDraft, setLabelDraft] = useState(data.label);
  const [addingMember, setAddingMember] = useState(false);
  const [search, setSearch] = useState("");

  const textColor = contrastText(data.color);

  return (
    <div
      className={`group min-w-[190px] rounded-xl border shadow-sm ${
        selected ? "border-accent ring-2 ring-accent/40" : "border-black/10"
      }`}
      style={{ background: data.color, color: textColor }}
    >
      <Handle
        type="target"
        position={Position.Top}
        title="Kéo từ ô khác vào đây để nối"
        className="!h-3 !w-3 !border-2 !border-white !bg-ink-2 hover:!bg-accent"
      />

      <div className="flex items-start gap-2 px-3.5 py-2.5">
        {editing ? (
          <div className="flex flex-1 flex-col gap-2" onPointerDownCapture={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              className={`${inputClasses} !bg-white !text-ink`}
            />
            <div className="flex items-center gap-1.5">
              {NODE_COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => data.onRename(id, labelDraft, c)}
                  className={`h-6 w-6 flex-shrink-0 cursor-pointer rounded-full border-2 ${
                    data.color === c ? "border-ink" : "border-white/60"
                  }`}
                  style={{ background: c }}
                  aria-label={`Chọn màu ${c}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Btn
                size="sm"
                variant="secondary"
                onClick={() => {
                  data.onRename(id, labelDraft, data.color);
                  setEditing(false);
                }}
              >
                Lưu
              </Btn>
              <Btn size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Huỷ
              </Btn>
            </div>
          </div>
        ) : (
          <>
            <span className="flex-1 text-[13.5px] leading-snug font-semibold whitespace-pre-line">
              {data.label}
            </span>
            {data.canEdit && (
              <div className="flex flex-shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  title="Sửa"
                  onClick={() => {
                    setLabelDraft(data.label);
                    setEditing(true);
                  }}
                  className="cursor-pointer rounded p-0.5 hover:bg-black/10"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  title="Xoá ô"
                  onClick={() => {
                    if (confirm(`Xoá "${data.label}" và mọi đường nối/thành viên bên trong?`))
                      data.onDelete(id);
                  }}
                  className="cursor-pointer rounded p-0.5 hover:bg-black/10"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {!editing && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full cursor-pointer items-center justify-center gap-1 border-t py-1 text-[11px] font-medium opacity-80 hover:opacity-100"
          style={{ borderColor: `${textColor}22` }}
        >
          {data.members.length > 0
            ? `${data.members.length} người`
            : "Thành viên"}
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      )}

      {expanded && (
        <div
          className="flex flex-col gap-1.5 rounded-b-xl bg-white px-3 py-2.5 text-ink"
          onPointerDownCapture={(e) => e.stopPropagation()}
        >
          {data.members.length === 0 && (
            <p className="text-xs text-ink-2">Chưa có thành viên.</p>
          )}
          {data.members.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <Avatar fullName={m.fullName} avatarUrl={m.avatarUrl} size={6} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-medium">{m.fullName}</span>
              </div>
              {m.orgLabel && (
                <span className="flex-shrink-0 rounded-full bg-wash px-1.5 py-0.5 text-[10px] text-ink-2">
                  {m.orgLabel}
                </span>
              )}
              {data.canEdit && (
                <button
                  type="button"
                  onClick={() => data.onRemoveMember(m.id)}
                  className="flex-shrink-0 cursor-pointer text-ink-2 hover:text-red-600"
                  title="Bỏ khỏi ô này"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}

          {data.canEdit &&
            (addingMember ? (
              <div className="mt-1 flex items-center gap-1.5">
                <PeoplePicker
                  staff={data.contacts}
                  value={search}
                  onChange={setSearch}
                  onSelect={(c) => {
                    data.onAddMember(id, c);
                    setSearch("");
                  }}
                  placeholder="Tìm tên hoặc email..."
                  inputClassName={`${inputClasses} w-full !text-[13px]`}
                />
                <button
                  type="button"
                  onClick={() => setAddingMember(false)}
                  className="flex-shrink-0 cursor-pointer text-ink-2 hover:text-ink"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingMember(true)}
                className="mt-0.5 flex cursor-pointer items-center gap-1 self-start text-xs font-medium text-accent hover:text-ink"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Thêm người
              </button>
            ))}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        title="Kéo ra để nối tới ô khác"
        className="!h-3 !w-3 !cursor-crosshair !border-2 !border-white !bg-ink-2 hover:!bg-accent"
      />
    </div>
  );
}
