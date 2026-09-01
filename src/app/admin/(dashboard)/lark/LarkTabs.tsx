"use client";

import { Children, isValidElement, useState, type ReactElement } from "react";

// `label` isn't rendered here — LarkTabs reads it off `panel.props.label`
// to build the tab bar without needing a separate labels array in sync.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function LarkTabPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return <>{children}</>;
}

export function LarkTabs({ children }: { children: React.ReactNode }) {
  const panels = Children.toArray(children).filter(isValidElement) as ReactElement<{ label: string }>[];
  const [active, setActive] = useState(0);
  const current = panels[active] ?? panels[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-6 border-b border-line">
        {panels.map((panel, i) => (
          <button
            key={panel.key ?? i}
            type="button"
            onClick={() => setActive(i)}
            className={`-mb-px cursor-pointer border-b-2 pb-3 text-sm font-medium transition-colors duration-300 ease-soft ${
              active === i ? "border-accent text-ink" : "border-transparent text-ink-2 hover:text-ink"
            }`}
          >
            {panel.props.label}
          </button>
        ))}
      </div>
      {current}
    </div>
  );
}
