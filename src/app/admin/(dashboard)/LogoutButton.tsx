import { logout } from "./actions";
import { btnClasses } from "./controls";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={logout}>
      <button
        type="submit"
        aria-label={compact ? "Đăng xuất" : undefined}
        title={compact ? "Đăng xuất" : undefined}
        className={btnClasses(
          "secondary",
          "md",
          `w-full justify-center ${compact ? "px-2.5" : ""}`,
        )}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
        {!compact && "Đăng xuất"}
      </button>
    </form>
  );
}
