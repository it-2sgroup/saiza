const BUTTONS = [
  {
    href: "tel:0946010818",
    title: "Gọi điện",
    bg: "bg-accent hover:bg-ink",
    ring: "bg-accent",
    delay: "0s",
    external: false,
    path: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  },
  {
    href: "https://zalo.me/0946010818",
    title: "Chat Zalo",
    bg: "bg-accent-2 hover:bg-ink",
    ring: "bg-accent-2",
    delay: "0.55s",
    external: true,
    path: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z",
  },
  {
    href: "https://m.me/2sgroup",
    title: "Nhắn tin Messenger",
    bg: "border border-line bg-white text-ink hover:bg-ink hover:text-white",
    ring: "bg-line",
    delay: "1.1s",
    external: true,
    path: "M22 2L11 13 M22 2l-7 20-4-9-9-4z",
  },
  {
    href: "https://www.tiktok.com/@2sgroup",
    title: "TikTok",
    bg: "bg-ink",
    ring: "bg-ink",
    delay: "1.65s",
    external: true,
    path: "M9 18V5l12-2v13 M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  },
];

export function FloatingContact() {
  return (
    <div className="fixed right-5.5 bottom-6.5 z-[60] flex flex-col items-end gap-3">
      {BUTTONS.map((button) => (
        <a
          key={button.title}
          href={button.href}
          title={button.title}
          target={button.external ? "_blank" : undefined}
          rel={button.external ? "noopener" : undefined}
          className={`relative flex h-13 w-13 items-center justify-center rounded-full text-white shadow-[0_10px_26px_rgba(18,41,42,0.28)] transition-transform duration-300 hover:scale-108 ${button.bg}`}
        >
          <span
            className={`absolute inset-0 animate-pulse-ring rounded-full ${button.ring}`}
            style={{ animationDelay: button.delay }}
          />
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
            <path d={button.path} />
          </svg>
        </a>
      ))}
    </div>
  );
}
