import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canDelete } from "@/lib/admin/permissions";
import { DeleteButton } from "./DeleteButton";

type ProductRow = { id: string; image_url: string; name_vi: string; tag_vi: string };

export default async function AdminProductsListPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, image_url, name_vi, tag_vi")
    .order("sort_order", { ascending: true });
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
      <div className="flex flex-col gap-3">
        {products.length === 0 && <p className="text-ink-2">Chưa có sản phẩm nào.</p>}
        {products.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between gap-4 rounded-card border border-line bg-card p-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-wash">
                {/* eslint-disable-next-line @next/next/no-img-element -- Storage/arbitrary host */}
                <img src={product.image_url} alt="" className="h-full w-full object-contain" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{product.name_vi}</span>
                <span className="text-xs text-ink-2">{product.tag_vi}</span>
              </div>
            </div>
            <div className="flex flex-shrink-0 gap-2">
              <Link
                href={`/admin/san-pham/${product.id}`}
                className="rounded-full border border-line px-4 py-2 text-sm font-medium transition-colors duration-300 ease-soft hover:border-ink"
              >
                Sửa
              </Link>
              {profile && canDelete(profile.role) && <DeleteButton id={product.id} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
