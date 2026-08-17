"use client";

import { closeJobPost } from "./actions";

export function CloseButton({ id }: { id: string }) {
  return (
    <form action={closeJobPost.bind(null, id)}>
      <button
        type="submit"
        className="cursor-pointer rounded-full border border-line px-4 py-2 text-sm font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink"
      >
        Ngừng tuyển
      </button>
    </form>
  );
}
