import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canDelete } from "@/lib/admin/permissions";
import { DeleteButton } from "./DeleteButton";

type ProductRow = { id: string; image_url: string; name_vi: string; tag_vi: string };

export default async function AdminProductsListPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  let request = supabase.from("products").select("id, image_url, name_vi, tag_vi").order("sort_order", { ascending: true });
  if (query) request = request.ilike("name_vi", `%${query}%`);
  const { data } = await request;
  const products = (data ?? []) as ProductRow[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium">Sản phẩm</h1>
        <Link
          href="/admin/san-pham/moi"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink"
        >
          + Thêm sản phẩm
        </Link>
      </div>

      <form action="/admin/san-pham" method="get" className="flex gap-2.5">
        <div className="relative max-w-[360px] flex-1">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Tìm theo tên sản phẩm..."
            className="w-full rounded-full border border-line bg-card py-2.5 pl-10 pr-4 text-[14.5px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30"
          />
        </div>
        {query && (
          <Link
            href="/admin/san-pham"
            className="flex items-center rounded-full border border-line px-4 text-sm font-medium text-ink-2 hover:border-ink hover:text-ink"
          >
            Xoá lọc
          </Link>
        )}
      </form>

      {products.length === 0 ? (
        <p className="text-ink-2">{query ? `Không tìm thấy sản phẩm khớp với "${query}".` : "Chưa có sản phẩm nào."}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex flex-col overflow-hidden rounded-card border border-line bg-card transition-shadow duration-300 ease-soft hover:shadow-[0_8px_24px_rgba(22,33,62,0.10)]"
            >
              <div className="flex h-28 flex-shrink-0 items-center justify-center bg-wash p-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- Storage/arbitrary host */}
                <img src={product.image_url} alt="" className="h-full w-full object-contain" />
              </div>
              <div className="flex flex-1 flex-col gap-2.5 p-4">
                <div className="flex flex-col gap-0.5">
                  <span className="line-clamp-2 text-[14.5px] font-semibold">{product.name_vi}</span>
                  <span className="text-xs text-ink-2">{product.tag_vi}</span>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-2.5">
                  <Link href={`/admin/san-pham/${product.id}`} className="text-sm font-medium text-accent hover:text-ink">
                    Sửa →
                  </Link>
                  {profile && canDelete(profile.role) && <DeleteButton id={product.id} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
