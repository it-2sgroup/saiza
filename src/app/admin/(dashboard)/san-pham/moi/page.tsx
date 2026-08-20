import { getCurrentProfile } from "@/lib/supabase/profile";
import { canPublish } from "@/lib/admin/permissions";
import { ProductForm } from "../ProductForm";
import { createProduct } from "../actions";

export default async function NewProductPage() {
  const profile = await getCurrentProfile();
  if (!profile || !canPublish(profile.role)) {
    return <p className="text-ink-2">Bạn không có quyền truy cập trang này.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-medium">Thêm sản phẩm</h1>
      <ProductForm action={createProduct} />
    </div>
  );
}
