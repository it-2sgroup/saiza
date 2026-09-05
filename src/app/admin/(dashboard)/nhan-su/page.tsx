import Link from "next/link";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canManageStaff, ROLE_LABELS } from "@/lib/admin/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { getConfigLists } from "@/lib/admin/configLists";
import { AddStaffModal } from "./AddStaffModal";
import { StaffRow } from "./StaffRow";
import type { StaffPerson } from "./StaffDetailModal";
import type { StaffRole } from "@/lib/supabase/profile";

const ROLE_TABS: { value: StaffRole | ""; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "admin", label: "Quản trị" },
  { value: "editor", label: "Biên tập viên" },
  { value: "contributor", label: "Cộng tác viên" },
];

const GROUP_ORDER: StaffRole[] = ["admin", "editor", "contributor"];

export default async function AdminStaffPage({
  searchParams,
}: {
  searchParams: Promise<{ vaiTro?: string; q?: string; phongBan?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile || !canManageStaff(profile.role)) {
    return <p className="text-ink-2">Bạn không có quyền truy cập trang này.</p>;
  }

  const currentUserId = profile.id;
  const sp = await searchParams;
  const vaiTro = (sp.vaiTro ?? "") as StaffRole | "";
  const q = (sp.q ?? "").trim().toLowerCase();
  const phongBan = sp.phongBan ?? "";

  const admin = createAdminClient();
  const [{ data: profilesData }, { data: usersData }, { departments }] = await Promise.all([
    admin.from("profiles").select("id, full_name, role, department, avatar_url, created_at").order("created_at", { ascending: false }),
    admin.auth.admin.listUsers(),
    getConfigLists(),
  ]);

  const userById = new Map(usersData?.users.map((u) => [u.id, u]) ?? []);
  const allStaff = (profilesData ?? []) as StaffPerson[];

  const tabCounts = Object.fromEntries(
    ROLE_TABS.map((t) => [t.value, t.value ? allStaff.filter((s) => s.role === t.value).length : allStaff.length]),
  ) as Record<StaffRole | "", number>;

  const filtered = allStaff.filter((person) => {
    if (vaiTro && person.role !== vaiTro) return false;
    if (phongBan && person.department !== phongBan) return false;
    if (q) {
      const email = (userById.get(person.id)?.email ?? "").toLowerCase();
      if (!person.full_name.toLowerCase().includes(q) && !email.includes(q)) return false;
    }
    return true;
  });

  const showGrouped = !vaiTro && !q && !phongBan;
  const qs = (overrides: Record<string, string>) => {
    const params = new URLSearchParams({ vaiTro, q: sp.q ?? "", phongBan, ...overrides });
    for (const [key, value] of [...params.entries()]) if (!value) params.delete(key);
    const str = params.toString();
    return str ? `?${str}` : "";
  };

  function renderRow(person: StaffPerson) {
    const user = userById.get(person.id);
    return (
      <StaffRow
        key={person.id}
        person={person}
        email={user?.email ?? "—"}
        isSelf={person.id === currentUserId}
        pendingInvite={!user?.email_confirmed_at}
        departments={departments}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-medium">Nhân sự</h1>
          <p className="text-ink-2">Tạo tài khoản và phân quyền cho nhân viên truy cập khu quản trị.</p>
        </div>
        <AddStaffModal departments={departments} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {ROLE_TABS.map((tab) => (
          <Link
            key={tab.value || "all"}
            href={`/admin/nhan-su${qs({ vaiTro: tab.value })}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300 ease-soft ${
              vaiTro === tab.value ? "bg-accent text-white" : "border border-line bg-card text-ink-2 hover:border-ink"
            }`}
          >
            {tab.label} ({tabCounts[tab.value]})
          </Link>
        ))}
      </div>

      <form action="/admin/nhan-su" method="get" className="flex flex-wrap gap-2.5">
        {vaiTro && <input type="hidden" name="vaiTro" value={vaiTro} />}
        <input
          type="text"
          name="q"
          defaultValue={sp.q}
          placeholder="Tìm theo tên hoặc email..."
          className="min-w-[220px] flex-1 rounded-full border border-line bg-card px-4 py-2.5 text-[14.5px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
        />
        <select
          name="phongBan"
          defaultValue={phongBan}
          className="rounded-full border border-line bg-card px-4 py-2.5 text-[14.5px] text-ink outline-none"
        >
          <option value="">Tất cả phòng ban</option>
          {departments.map((d) => (
            <option key={d.code} value={d.code}>
              {d.label}
            </option>
          ))}
        </select>
        <button type="submit" className="cursor-pointer rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink">
          Lọc
        </button>
        {(sp.q || phongBan) && (
          <Link
            href={`/admin/nhan-su${qs({ q: "", phongBan: "" })}`}
            className="flex items-center rounded-full border border-line px-4 text-sm font-medium text-ink-2 hover:border-ink hover:text-ink"
          >
            Xoá lọc
          </Link>
        )}
      </form>

      {filtered.length === 0 ? (
        <p className="text-sm text-ink-2">Không có nhân viên nào khớp bộ lọc.</p>
      ) : showGrouped ? (
        <div className="flex flex-col gap-6">
          {GROUP_ORDER.map((role) => {
            const rows = filtered.filter((p) => p.role === role);
            if (rows.length === 0) return null;
            return (
              <div key={role} className="flex flex-col gap-2.5">
                <h2 className="text-sm font-semibold text-ink-2 uppercase tracking-[0.06em]">
                  {ROLE_LABELS[role]} · {rows.length} người
                </h2>
                <div className="flex flex-col gap-2">{rows.map(renderRow)}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2">{filtered.map(renderRow)}</div>
      )}
    </div>
  );
}
