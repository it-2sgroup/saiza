"use client";

import { useActionState } from "react";
import type { NewsPost } from "@/lib/admin/types";
import type { StaffRole } from "@/lib/supabase/profile";
import { canPublish } from "@/lib/admin/permissions";
import type { NewsFormState } from "./actions";

type NewsFormProps = {
  role: StaffRole;
  post?: NewsPost;
  action: (prevState: NewsFormState, formData: FormData) => Promise<NewsFormState>;
};

const initialState: NewsFormState = { error: null };
const fieldClasses =
  "rounded-[14px] border border-line bg-paper px-4 py-3 text-[15px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

export function NewsForm({ role, post, action }: NewsFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const allowPublish = canPublish(role);

  return (
    <form action={formAction} className="flex max-w-[720px] flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
          Tiêu đề
        </label>
        <input id="title" name="title" defaultValue={post?.title} required className={fieldClasses} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="tag" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
          Danh mục
        </label>
        <input
          id="tag"
          name="tag"
          defaultValue={post?.tag ?? ""}
          placeholder="Ví dụ: Sản phẩm, Doanh nghiệp..."
          className={fieldClasses}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cover_image" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
          Ảnh bìa (URL)
        </label>
        <input id="cover_image" name="cover_image" defaultValue={post?.cover_image ?? ""} className={fieldClasses} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="excerpt" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
          Mô tả ngắn
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          defaultValue={post?.excerpt}
          className={`resize-y ${fieldClasses}`}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="body" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
          Nội dung
        </label>
        <textarea
          id="body"
          name="body"
          rows={12}
          defaultValue={post?.body}
          required
          className={`resize-y leading-[1.7] ${fieldClasses}`}
        />
      </div>
      {allowPublish ? (
        <label className="flex items-center gap-2.5 text-sm font-medium">
          <input type="checkbox" name="publish" defaultChecked={post?.status === "published"} className="h-4 w-4" />
          Xuất bản công khai ngay
        </label>
      ) : (
        <p className="text-sm text-ink-2">
          Bài viết sẽ được lưu ở trạng thái nháp, chờ Biên tập viên hoặc Admin duyệt xuất bản.
        </p>
      )}
      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-fit cursor-pointer rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Đang lưu..." : "Lưu bài viết"}
      </button>
    </form>
  );
}
