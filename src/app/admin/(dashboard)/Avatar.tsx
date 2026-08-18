import { getInitials } from "@/lib/admin/initials";

export function Avatar({ fullName, avatarUrl, size = 10 }: { fullName: string; avatarUrl: string | null; size?: number }) {
  return (
    <span
      className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-sm font-semibold text-white"
      style={{ height: `${size * 4}px`, width: `${size * 4}px` }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage public URL, arbitrary host
        <img src={avatarUrl} alt={fullName} className="h-full w-full object-cover" />
      ) : (
        getInitials(fullName)
      )}
    </span>
  );
}
