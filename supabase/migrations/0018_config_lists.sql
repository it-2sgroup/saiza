-- Moves DEPARTMENTS / ORG_CODES / DOC_TYPES out of hardcoded app code into an
-- admin-editable table. These three were the "add/remove tags" the admin
-- asked for on the Nhân sự page and the Lark naming-convention settings —
-- unlike staff roles (admin/editor/contributor), which stay hardcoded on
-- purpose: roles are baked into RLS policies, a CHECK constraint, and the
-- JWT custom-claims hook (see 0001/0002), so making them freely admin-
-- editable would require redesigning the authorization model itself, not
-- just moving a list of labels.
create table public.config_lists (
  id uuid primary key default gen_random_uuid(),
  list_key text not null check (list_key in ('department', 'org_code', 'doc_type')),
  code text not null,
  label text not null,
  note text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (list_key, code)
);

alter table public.config_lists enable row level security;

-- Every signed-in staff member needs to read these (dropdowns, name
-- resolution) — write access is the part that's admin-only.
create policy "config_lists_read" on public.config_lists
  for select using (auth.role() = 'authenticated');

create policy "config_lists_admin_write" on public.config_lists
  for all using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

create index config_lists_list_key_idx on public.config_lists (list_key, sort_order);

-- Seed with the exact values that were previously hardcoded in
-- src/lib/admin/departments.ts and src/lib/admin/docTypes.ts, so existing
-- naming conventions and staff department assignments keep resolving to the
-- same labels after this migration — nothing changes for end users until an
-- admin actually edits the list.
insert into public.config_lists (list_key, code, label, note, sort_order) values
  ('department', 'BGD', 'Ban Giám đốc', 'Tài liệu chiến lược, báo cáo cấp cao', 0),
  ('department', 'KT', 'Tài chính – Kế toán', null, 1),
  ('department', 'HCNS', 'Hành chính – Nhân sự', null, 2),
  ('department', 'MKT', 'Marketing', null, 3),
  ('department', 'MD', 'Media (video và live)', null, 4),
  ('department', 'IT', 'Công nghệ thông tin', null, 5),
  ('department', 'SP', 'Sản phẩm', null, 6),
  ('department', 'KD', 'Kinh doanh', null, 7),
  ('department', 'TT', 'Kênh TikTok', 'Thuộc Phòng Kinh doanh', 8),
  ('department', 'SHP', 'Kênh Shopee', 'Thuộc Phòng Kinh doanh', 9),
  ('department', 'FB', 'Kênh Facebook', 'Thuộc Phòng Kinh doanh', 10),
  ('department', 'BK', 'Booking', 'Thuộc kênh TikTok', 11),
  ('department', 'VH', 'Vận hành', null, 12),
  ('department', 'CSKH', 'Chăm sóc khách hàng', null, 13),
  ('department', 'TM', 'Thu mua', null, 14),
  ('department', 'ALL', 'Toàn công ty', 'Tài liệu dùng chung cho mọi phòng ban', 15),
  ('org_code', 'SISMO', 'SISMO', null, 0),
  ('org_code', 'SAIZA', 'SAIZA', null, 1),
  ('org_code', '2S', '2S', null, 2),
  ('doc_type', 'Báo Cáo', 'Báo cáo', 'Báo cáo định kỳ, báo cáo dự án', 0),
  ('doc_type', 'Kế Hoạch', 'Kế hoạch', 'Kế hoạch, đề xuất', 1),
  ('doc_type', 'Hợp Đồng', 'Hợp đồng', 'Hợp đồng, phụ lục hợp đồng', 2),
  ('doc_type', 'Biên Bản', 'Biên bản', 'Biên bản họp / nghiệm thu', 3),
  ('doc_type', 'Tài Liệu', 'Tài liệu', 'Tài liệu kỹ thuật, hướng dẫn', 4),
  ('doc_type', 'Template', 'Template', 'Biểu mẫu, mẫu dùng lại', 5),
  ('doc_type', 'Chính Sách', 'Chính sách', 'Chính sách nội bộ', 6);
