"use client";

import { useState } from "react";
import { HubCard } from "./HubCard";

const recentIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

export function RecentFilesSection({ count, children }: { count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <HubCard icon={recentIcon} title="File gần đây" description={`${count} file bạn đã tạo`} onClick={() => setOpen((o) => !o)} />
      {open && children}
    </div>
  );
}
