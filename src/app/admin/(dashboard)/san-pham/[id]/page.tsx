import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { canPublish } from "@/lib/admin/permissions";
import { ProductForm } from "../ProductForm";
import { updateProduct } from "../actions";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile || !(await canPublish(profile.role))) {
    return <p className="text-ink-2">Bạn không có quyền truy cập trang này.</p>;
  }

  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").eq("id", id).single();
  if (!data) notFound();

  const action = updateProduct.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium">Sửa sản phẩm</h1>
      <ProductForm product={data} action={action} />
    </div>
  );
}
