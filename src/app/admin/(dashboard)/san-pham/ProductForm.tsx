"use client";

import { useActionState } from "react";
import type { ProductFormState } from "./actions";

type ProductRow = {
  id: string;
  image_url: string;
  brand: string;
  tag_vi: string;
  tag_en: string;
  name_vi: string;
  name_en: string;
  desc_short_vi: string;
  desc_short_en: string;
  desc_long_vi: string;
  desc_long_en: string;
  features_vi: string | null;
  features_en: string | null;
  volume: string | null;
  price_label_vi: string | null;
  price_label_en: string | null;
  product_type_vi: string | null;
  product_type_en: string | null;
  form_vi: string | null;
  form_en: string | null;
  shelf_life_vi: string | null;
  shelf_life_en: string | null;
  scent_vi: string | null;
  scent_en: string | null;
  ingredients_vi: string | null;
  ingredients_en: string | null;
  usage_vi: string | null;
  usage_en: string | null;
  notes_vi: string | null;
  notes_en: string | null;
};

type ProductFormProps = {
  product?: ProductRow;
  action: (prevState: ProductFormState, formData: FormData) => Promise<ProductFormState>;
};

const initialState: ProductFormState = { error: null };
const fieldClasses =
  "rounded-[14px] border border-line bg-paper px-4 py-3 text-[15px] text-ink outline-none transition-all duration-300 ease-soft focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

function BilingualRow({
  label,
  nameVi,
  nameEn,
  defaultVi,
  defaultEn,
  textarea,
  rows,
}: {
  label: string;
  nameVi: string;
  nameEn: string;
  defaultVi?: string | null;
  defaultEn?: string | null;
  textarea?: boolean;
  rows?: number;
}) {
  const Field = textarea ? "textarea" : "input";
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={nameVi} className="text-xs tracking-[0.1em] text-ink-2 uppercase">
          {label} (VI)
        </label>
        <Field
          id={nameVi}
          name={nameVi}
          rows={textarea ? rows : undefined}
          defaultValue={defaultVi ?? ""}
          className={textarea ? `resize-y ${fieldClasses}` : fieldClasses}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={nameEn} className="text-xs tracking-[0.1em] text-ink-2 uppercase">
          {label} (EN)
        </label>
        <Field
          id={nameEn}
          name={nameEn}
          rows={textarea ? rows : undefined}
          defaultValue={defaultEn ?? ""}
          className={textarea ? `resize-y ${fieldClasses}` : fieldClasses}
        />
      </div>
    </div>
  );
}

export function ProductForm({ product, action }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-[760px] flex-col gap-8">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="image" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
            Ảnh sản phẩm{product ? " (để trống nếu không đổi)" : ""}
          </label>
          {product && (
            <div className="mb-1 flex aspect-square w-32 items-center justify-center overflow-hidden rounded-2xl bg-wash">
              {/* eslint-disable-next-line @next/next/no-img-element -- Storage/arbitrary host */}
              <img src={product.image_url} alt="" className="h-full w-full object-contain" />
            </div>
          )}
          <input
            id="image"
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required={!product}
            className={fieldClasses}
          />
        </div>

        <BilingualRow label="Nhãn" nameVi="tag_vi" nameEn="tag_en" defaultVi={product?.tag_vi} defaultEn={product?.tag_en} />
        <BilingualRow
          label="Tên sản phẩm"
          nameVi="name_vi"
          nameEn="name_en"
          defaultVi={product?.name_vi}
          defaultEn={product?.name_en}
        />
        <BilingualRow
          label="Mô tả ngắn"
          nameVi="desc_short_vi"
          nameEn="desc_short_en"
          defaultVi={product?.desc_short_vi}
          defaultEn={product?.desc_short_en}
          textarea
          rows={2}
        />
        <BilingualRow
          label="Mô tả đầy đủ"
          nameVi="desc_long_vi"
          nameEn="desc_long_en"
          defaultVi={product?.desc_long_vi}
          defaultEn={product?.desc_long_en}
          textarea
          rows={4}
        />
      </div>

      <div className="flex flex-col gap-5 border-t border-line pt-6">
        <h2 className="text-sm font-semibold">Trang chi tiết sản phẩm</h2>
        <p className="-mt-3 text-xs text-ink-2">
          Các mục dưới đây hiển thị trên trang chi tiết sản phẩm — để trống mục nào thì mục đó sẽ tự ẩn trên trang.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="brand" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
              Thương hiệu
            </label>
            <input id="brand" name="brand" defaultValue={product?.brand ?? "SAIZA"} className={fieldClasses} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="volume" className="text-xs tracking-[0.1em] text-ink-2 uppercase">
              Dung tích
            </label>
            <input
              id="volume"
              name="volume"
              placeholder="Ví dụ: 500ml"
              defaultValue={product?.volume ?? ""}
              className={fieldClasses}
            />
          </div>
        </div>

        <BilingualRow
          label="Giá (hiển thị)"
          nameVi="price_label_vi"
          nameEn="price_label_en"
          defaultVi={product?.price_label_vi}
          defaultEn={product?.price_label_en}
        />
        <BilingualRow
          label="Tính năng (mỗi dòng một tính năng)"
          nameVi="features_vi"
          nameEn="features_en"
          defaultVi={product?.features_vi}
          defaultEn={product?.features_en}
          textarea
          rows={3}
        />

        <h3 className="-mb-1 text-xs font-semibold tracking-[0.1em] text-ink-2 uppercase">Bảng thông số</h3>
        <BilingualRow
          label="Đặc điểm sản phẩm"
          nameVi="product_type_vi"
          nameEn="product_type_en"
          defaultVi={product?.product_type_vi}
          defaultEn={product?.product_type_en}
        />
        <BilingualRow
          label="Hình thức sản phẩm"
          nameVi="form_vi"
          nameEn="form_en"
          defaultVi={product?.form_vi}
          defaultEn={product?.form_en}
        />
        <BilingualRow
          label="Hạn sử dụng"
          nameVi="shelf_life_vi"
          nameEn="shelf_life_en"
          defaultVi={product?.shelf_life_vi}
          defaultEn={product?.shelf_life_en}
        />
        <BilingualRow
          label="Mùi hương"
          nameVi="scent_vi"
          nameEn="scent_en"
          defaultVi={product?.scent_vi}
          defaultEn={product?.scent_en}
        />
        <BilingualRow
          label="Thành phần"
          nameVi="ingredients_vi"
          nameEn="ingredients_en"
          defaultVi={product?.ingredients_vi}
          defaultEn={product?.ingredients_en}
          textarea
          rows={2}
        />

        <BilingualRow
          label="Hướng dẫn sử dụng (mỗi dòng một bước)"
          nameVi="usage_vi"
          nameEn="usage_en"
          defaultVi={product?.usage_vi}
          defaultEn={product?.usage_en}
          textarea
          rows={4}
        />
        <BilingualRow
          label="Lưu ý (mỗi dòng một mục)"
          nameVi="notes_vi"
          nameEn="notes_en"
          defaultVi={product?.notes_vi}
          defaultEn={product?.notes_en}
          textarea
          rows={3}
        />
      </div>

      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-fit cursor-pointer rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 ease-soft hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Đang lưu..." : "Lưu sản phẩm"}
      </button>
    </form>
  );
}
