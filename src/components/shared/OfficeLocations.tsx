"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { offices, type OfficeId } from "@/lib/data/offices";

export function OfficeLocations() {
  const { t } = useLanguage();
  const [activeOffice, setActiveOffice] = useState<OfficeId>("hcm");

  return (
    <div>
      <div className="mb-4 flex gap-2.5">
        {offices.map((office) => (
          <button
            key={office.id}
            type="button"
            onClick={() => setActiveOffice(office.id)}
            className={`rounded-full border border-line px-4.5 py-2.5 text-[13.5px] font-semibold transition-all duration-250 ${
              activeOffice === office.id ? "bg-ink text-white" : "text-ink-2"
            }`}
          >
            {t.offices[office.id]}
          </button>
        ))}
      </div>
      <div className="aspect-[16/7] overflow-hidden rounded-card border border-line">
        {offices.map((office) => (
          <iframe
            key={office.id}
            title={t.offices[office.id]}
            src={office.mapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full border-0"
            style={{ display: activeOffice === office.id ? "block" : "none" }}
          />
        ))}
      </div>
    </div>
  );
}
