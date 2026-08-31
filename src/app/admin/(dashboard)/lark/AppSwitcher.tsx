"use client";

import { useTransition } from "react";
import { Combobox } from "../Combobox";
import { switchLarkApp } from "./actions";

export function AppSwitcher({ apps, activeKey }: { apps: { key: string; label: string }[]; activeKey: string }) {
  const [pending, startTransition] = useTransition();

  if (apps.length <= 1) return null;

  return (
    <Combobox
      value={activeKey}
      options={apps.map((a) => ({ value: a.key, label: a.label }))}
      onChange={(key) => startTransition(() => switchLarkApp(key))}
      buttonClassName={`flex h-10 flex-shrink-0 items-center gap-1.5 rounded-full border border-line bg-card px-3.5 text-sm font-medium text-ink-2 transition-colors duration-300 ease-soft hover:border-ink hover:text-ink ${pending ? "opacity-60" : ""}`}
    />
  );
}
