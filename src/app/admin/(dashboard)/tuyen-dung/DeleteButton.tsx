"use client";

import { deleteJobPost } from "./actions";

export function DeleteButton({ id }: { id: string }) {
  return (
    <form
      action={deleteJobPost.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm("Xoá tin tuyển dụng này?")) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="cursor-pointer rounded-full border border-line px-4 py-2 text-sm font-medium text-red-600 transition-colors duration-300 ease-soft hover:border-red-600"
      >
        Xoá
      </button>
    </form>
  );
}
