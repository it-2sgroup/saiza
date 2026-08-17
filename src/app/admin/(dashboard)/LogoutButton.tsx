import { logout } from "./actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="w-full cursor-pointer rounded-full border border-line px-4 py-2.5 text-sm font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink"
      >
        Đăng xuất
      </button>
    </form>
  );
}
