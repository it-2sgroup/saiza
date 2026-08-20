import { getSiteConfig } from "@/lib/content/site-config";
import { phoneToTelHref } from "@/lib/phone";

function buildButtons(config: { phone: string; zaloUrl: string; messengerUrl: string; tiktokUrl: string }) {
  return [
    {
      href: phoneToTelHref(config.phone),
      title: "Gọi điện",
      bg: "bg-accent hover:bg-ink",
      ring: "bg-accent",
      delay: "0s",
      external: false,
      icon: "phone" as const,
    },
    {
      href: config.zaloUrl,
      title: "Chat Zalo",
      bg: "bg-transparent",
      ring: "bg-[#0068ff]",
      delay: "0.55s",
      external: true,
      icon: "zalo" as const,
    },
    {
      href: config.messengerUrl,
      title: "Nhắn tin Messenger",
      bg: "bg-ink-2 hover:bg-ink",
      ring: "bg-ink-2",
      delay: "1.1s",
      external: true,
      icon: "messenger" as const,
    },
    {
      href: config.tiktokUrl,
      title: "TikTok",
      bg: "bg-ink",
      ring: "bg-ink",
      delay: "1.65s",
      external: true,
      icon: "tiktok" as const,
    },
  ];
}

function ButtonIcon({ icon }: { icon: "phone" | "zalo" | "messenger" | "tiktok" }) {
  if (icon === "phone") {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative z-10"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    );
  }

  if (icon === "zalo") {
    return (
      <svg width="52" height="52" viewBox="0 0 100 100" className="relative z-10" aria-hidden="true">
        <circle cx="50" cy="50" r="50" fill="#0068ff" />
        <circle cx="56" cy="45" r="38" fill="#fff" />
        <path d="M25 73c-3 8-9 14-17 18 10-1 19-5 26-11-4-2-7-4-9-7z" fill="#fff" />
        <text
          x="56"
          y="57"
          textAnchor="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="800"
          fontStyle="italic"
          fontSize="29"
          fill="#0068ff"
        >
          Zalo
        </text>
      </svg>
    );
  }

  if (icon === "messenger") {
    return (
      <svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor" className="relative z-10" aria-hidden="true">
        <path d="M256.55 8C116.52 8 8 110.34 8 248.57c0 72.3 29.71 134.78 78.07 177.94 8.35 7.51 6.63 11.86 8.05 58.23A19.92 19.92 0 0 0 122 502.31c52.91-23.3 53.59-25.14 62.56-22.7C337.85 521.8 504 423.7 504 248.57 504 110.34 396.53 8 256.55 8zm149.24 185.13-73 115.57a37.37 37.37 0 0 1-53.91 9.93l-58.10-43.53a15 15 0 0 0-18 0l-78.44 59.4c-10.46 7.93-24.16-4.6-17.11-15.67l73-115.57a37.36 37.36 0 0 1 53.91-9.93l58.1 43.53a15 15 0 0 0 18 0l78.44-59.4c10.46-7.94 24.16 4.6 17.11 15.67z" />
      </svg>
    );
  }

  return (
    <svg width="19" height="19" viewBox="0 0 448 512" fill="currentColor" className="relative z-10" aria-hidden="true">
      <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" />
    </svg>
  );
}

export async function FloatingContact() {
  const config = await getSiteConfig();
  const buttons = buildButtons(config);

  return (
    <div className="fixed right-5.5 bottom-6.5 z-[60] flex flex-col items-end gap-3">
      {buttons.map((button) => (
        <a
          key={button.title}
          href={button.href}
          title={button.title}
          aria-label={button.title}
          target={button.external ? "_blank" : undefined}
          rel={button.external ? "noopener" : undefined}
          className={`relative flex h-13 w-13 items-center justify-center rounded-full text-white shadow-[0_10px_26px_rgba(18,41,42,0.28)] transition-transform duration-300 hover:scale-108 ${button.bg}`}
        >
          <span
            aria-hidden="true"
            className={`absolute inset-0 animate-pulse-ring rounded-full ${button.ring}`}
            style={{ animationDelay: button.delay }}
          />
          <ButtonIcon icon={button.icon} />
        </a>
      ))}
    </div>
  );
}
