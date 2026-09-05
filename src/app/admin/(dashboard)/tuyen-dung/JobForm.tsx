"use client";

import { useActionState } from "react";
import type { JobPost } from "@/lib/admin/types";
import type { JobFormState } from "./actions";

type JobFormProps = {
  // Computed server-side (canPublish reads a DB-backed role capability now,
  // which a client component can't do) and passed down as a plain boolean.
  allowPublish: boolean;
  job?: JobPost;
  action: (prevState: JobFormState, formData: FormData) => Promise<JobFormState>;
};

const initialState: JobFormState = { error: null };
const fieldClasses =
  "rounded-[14px] border border-line bg-paper px-4 py-3 text-[15px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

export function JobForm({ allowPublish, job, action }: JobFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-[720px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
          Vị trí tuyển dụng
        </label>
        <input id="title" name="title" defaultValue={job?.title} required className={fieldClasses} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="department" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
            Phòng ban
          </label>
          <input id="department" name="department" defaultValue={job?.department ?? ""} className={fieldClasses} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="location" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
            Địa điểm
          </label>
          <input
            id="location"
            name="location"
            defaultValue={job?.location ?? ""}
            placeholder="TP.HCM, Đà Nẵng..."
            className={fieldClasses}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="employment_type" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
            Hình thức
          </label>
          <input
            id="employment_type"
            name="employment_type"
            defaultValue={job?.employment_type ?? ""}
            placeholder="Toàn thời gian, Bán thời gian..."
            className={fieldClasses}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="salary_note" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
            Mức lương
          </label>
          <input
            id="salary_note"
            name="salary_note"
            defaultValue={job?.salary_note ?? ""}
            placeholder="Thoả thuận, 8-12 triệu..."
            className={fieldClasses}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
          Mô tả công việc
        </label>
        <textarea
          id="description"
          name="description"
          rows={6}
          defaultValue={job?.description}
          required
          className={`resize-y leading-[1.7] ${fieldClasses}`}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="requirements" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
          Yêu cầu ứng viên
        </label>
        <textarea
          id="requirements"
          name="requirements"
          rows={5}
          defaultValue={job?.requirements}
          className={`resize-y leading-[1.7] ${fieldClasses}`}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="benefits" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
          Quyền lợi
        </label>
        <textarea
          id="benefits"
          name="benefits"
          rows={5}
          defaultValue={job?.benefits}
          className={`resize-y leading-[1.7] ${fieldClasses}`}
        />
      </div>
      {allowPublish ? (
        <label className="flex items-center gap-2.5 text-sm font-medium">
          <input type="checkbox" name="publish" defaultChecked={job?.status === "open"} className="h-4 w-4" />
          Mở tuyển ngay (hiện công khai)
        </label>
      ) : (
        <p className="text-sm text-ink-2">Tin tuyển dụng sẽ được lưu ở trạng thái nháp, chờ Biên tập viên hoặc Admin duyệt mở tuyển.</p>
      )}
      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-fit cursor-pointer rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Đang lưu..." : "Lưu tin tuyển dụng"}
      </button>
    </form>
  );
}
