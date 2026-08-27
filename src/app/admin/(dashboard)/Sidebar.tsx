"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/lib/supabase/profile";
import { NavLinks, type NavItem } from "./NavLinks";
import { SettingsModal } from "./SettingsModal";
import { LogoutButton } from "./LogoutButton";

const STORAGE_KEY = "admin-sidebar-collapsed";

export function Sidebar({ profile, items }: { profile: Profile; items: NavItem[] }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Reads a client-only preference from localStorage after mount, matching server-rendered
    // (collapsed=false) state on first paint to avoid a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  };

  return (
    <aside
      className={`flex h-full flex-shrink-0 flex-col gap-1 overflow-y-auto border-r border-line bg-card p-5 transition-[width] duration-300 ease-soft ${
        collapsed ? "w-[84px]" : "w-64"
      }`}
    >
      <div className={`mb-4 flex items-center gap-2.5 px-1 ${collapsed ? "justify-center" : ""}`}>
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-white admin-hero-gradient">
          S
        </span>
        {!collapsed && (
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-semibold text-accent">SAIZA</span>
            <span className="text-xs text-ink-2">Khu quản trị</span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
        className={`mb-4 flex items-center gap-2 rounded-full border border-line px-3 py-2 text-xs font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink ${
          collapsed ? "justify-center" : ""
        }`}
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
          className={`flex-shrink-0 transition-transform duration-300 ease-soft ${collapsed ? "rotate-180" : ""}`}
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        {!collapsed && "Thu gọn"}
      </button>

      {!collapsed && <span className="mb-1 px-3.5 text-[11px] font-semibold tracking-[0.1em] text-ink-2 uppercase">Menu</span>}
      <NavLinks items={items} collapsed={collapsed} />

      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-4">
        <SettingsModal profile={profile} compact={collapsed} />
        <LogoutButton compact={collapsed} />
      </div>
    </aside>
  );
}
