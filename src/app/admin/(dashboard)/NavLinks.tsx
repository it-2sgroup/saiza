"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS = {
  overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  news: (
    <>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </>
  ),
  jobs: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>
  ),
  products: (
    <>
      <path d="M20.5 7.27 12 12l-8.5-4.73" />
      <path d="M12 22V12" />
      <path d="m20.5 7.27-8.5 4.73-8.5-4.73L12 2.5l8.5 4.77Z" />
    </>
  ),
  inbox: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </>
  ),
  staff: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  images: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </>
  ),
  text: (
    <>
      <path d="M4 7V4h16v3" />
      <path d="M9 20h6" />
      <path d="M12 4v16" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
  lark: (
    <>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M12 11v6" />
      <path d="M9 14h6" />
    </>
  ),
  tags: (
    <>
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </>
  ),
} as const;

export type NavIconName = keyof typeof ICONS;

// locked = visible but not clickable, because the viewer's role lacks the
// capability that tab needs — deliberately NOT omitted from the list, so a
// role change is discoverable ("this exists, ask an admin") instead of
// looking like the feature doesn't exist at all.
export type NavItem = {
  href: string;
  label: string;
  icon: NavIconName;
  locked?: boolean;
};

function LockIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0"
      aria-hidden="true"
    >
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function NavIcon({ name }: { name: NavIconName }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

export function NavLinks({
  items,
  collapsed = false,
}: {
  items: NavItem[];
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        const tooltipText = item.locked
          ? `${item.label} (chưa được cấp quyền)`
          : item.label;

        if (item.locked) {
          return (
            <div key={item.href} className="group relative">
              <span
                aria-disabled="true"
                aria-label={collapsed ? tooltipText : undefined}
                title={
                  !collapsed
                    ? "Bạn chưa được cấp quyền truy cập mục này."
                    : undefined
                }
                className={`flex cursor-not-allowed items-center gap-2.5 rounded-full border-l-[3px] border-transparent py-2.5 text-sm font-medium text-ink-2/40 ${
                  collapsed ? "justify-center px-2.5" : "px-3.5"
                }`}
              >
                <NavIcon name={item.icon} />
                {!collapsed && (
                  <span className="flex flex-1 items-center justify-between gap-2">
                    {item.label}
                    <LockIcon />
                  </span>
                )}
                {collapsed && <LockIcon />}
              </span>
              {collapsed && (
                <span className="pointer-events-none absolute top-1/2 left-full z-50 ml-2 -translate-y-1/2 rounded-md bg-ink px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                  {tooltipText}
                </span>
              )}
            </div>
          );
        }

        return (
          <div key={item.href} className="group relative">
            <Link
              href={item.href}
              aria-label={collapsed ? item.label : undefined}
              className={`flex items-center gap-2.5 rounded-full border-l-[3px] py-2.5 text-sm font-medium transition-colors duration-300 ease-soft ${
                collapsed ? "justify-center px-2.5" : "px-3.5"
              } ${active ? "border-accent bg-wash text-accent" : "border-transparent text-ink-2 hover:bg-wash hover:text-accent"}`}
            >
              <NavIcon name={item.icon} />
              {!collapsed && item.label}
            </Link>
            {collapsed && (
              <span className="pointer-events-none absolute top-1/2 left-full z-50 ml-2 -translate-y-1/2 rounded-md bg-ink px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
