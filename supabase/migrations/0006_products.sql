-- Full product catalog, replacing the static `src/lib/data/products.ts` +
-- i18n-dictionary-lookup pattern. Admins can now add/edit/delete products
-- (image + bilingual copy) instead of only swapping a fixed product's photo.
-- Public read (drives the public site), writes go through the service-role
-- client from admin server actions (role-checked via canPublish()/
-- canDelete()) — same pattern as news_posts/job_posts.

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  image_url text not null,
  tag_vi text not null default '',
  tag_en text not null default '',
  name_vi text not null,
  name_en text not null,
  desc_short_vi text not null default '',
  desc_short_en text not null default '',
  desc_long_vi text not null default '',
  desc_long_en text not null default '',
  sort_order integer not null default 0,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "products_public_read" on public.products
  for select using (true);

create index products_sort_order_idx on public.products (sort_order);

-- Seed with the six products already hardcoded on the site today, so the
-- public pages keep showing the same catalog once the app switches over to
-- reading from this table.
insert into public.products
  (slug, image_url, tag_vi, tag_en, name_vi, name_en, desc_short_vi, desc_short_en, desc_long_vi, desc_long_en, sort_order)
values
(
  'drum-cleaner',
  'https://2sgroup.vn/wp-content/uploads/2025/04/vn-11134207-7r98o-ltqfjf2hve3173.webp',
  'Máy giặt',
  'Laundry',
  'Bột vệ sinh lồng máy giặt SAIZA',
  'SAIZA Washing Machine Drum Cleaner',
  'Loại bỏ cặn bẩn và mùi hôi trong lồng giặt, giúp máy bền hơn và tiết kiệm điện.',
  'Removes residue and odour inside the drum, extending machine life and saving energy.',
  'Loại bỏ cặn bẩn, mùi hôi và vi khuẩn tích tụ trong lồng giặt. Dùng định kỳ mỗi tháng để máy bền và tiết kiệm điện.',
  'Removes residue, odour and built-up bacteria inside the drum. Use monthly to keep the machine running longer and save energy.',
  1
),
(
  'multi-cleaner',
  'https://2sgroup.vn/wp-content/uploads/2025/04/A1.jpeg',
  'Đa năng',
  'Multi-purpose',
  'Dung dịch tẩy đa năng SAIZA',
  'SAIZA Multi-purpose Cleaner',
  'Kháng khuẩn 99,99%, xử lý vết ố, rỉ sét và khử mùi hiệu quả trên nhiều bề mặt.',
  '99.99% antibacterial; removes stains, rust and odour on many surfaces.',
  'Kháng khuẩn 99,99%, làm sạch vết ố, rỉ sét và khử mùi. Phù hợp cho sàn, tường, thiết bị vệ sinh.',
  '99.99% antibacterial, removes stains, rust and odour. Suited to floors, walls and bathroom fixtures.',
  2
),
(
  'delicate-wash',
  'https://2sgroup.vn/wp-content/uploads/2025/04/Anh-01-tui-1024x1024.jpg',
  'Chuyên dụng',
  'Specialist',
  'Nước giặt đồ lót SAIZA Silky Clean',
  'SAIZA Silky Clean Delicate Wash',
  'Làm sạch sâu, giữ sợi vải mềm mại, dịu nhẹ với da và thân thiện với môi trường.',
  'Deep clean, keeps fabric soft, gentle on skin and eco-friendly.',
  'Công thức dịu nhẹ dành riêng cho đồ lót: sạch sâu, giữ form vải, an toàn cho da nhạy cảm.',
  'A gentle formula made for delicates: deep clean, keeps fabric shape, safe for sensitive skin.',
  3
),
(
  'kitchen-spray',
  'https://2sgroup.vn/wp-content/uploads/2025/04/z6115050369008_5f2b24a8b31214e974b9d7a7e0dfac23-1024x1024.jpg',
  'Nhà bếp',
  'Kitchen',
  'Xịt vệ sinh nhà bếp đa năng SAIZA',
  'SAIZA Kitchen Degreaser Spray',
  'Đánh tan dầu mỡ và bám bẩn cứng đầu, giữ khu vực nấu nướng sáng bóng.',
  'Cuts through grease and stubborn grime, keeping the kitchen spotless.',
  'Xử lý dầu mỡ trên bếp, máy hút mùi, tường kính và bồn rửa chỉ với vài lần xịt.',
  'Cuts through grease on stovetops, range hoods, glass and sinks in just a few sprays.',
  4
),
(
  'bathroom-spray',
  'https://2sgroup.vn/wp-content/uploads/2025/04/chai-doi-1024x1024.png',
  'Nhà tắm',
  'Bathroom',
  'Xịt vệ sinh nhà tắm SAIZA',
  'SAIZA Bathroom Cleaning Spray',
  'Làm sạch mảng bám, cặn xà phòng và khử mùi, an toàn cho men gạch, thiết bị sứ.',
  'Removes limescale and soap residue, deodorises, safe on tiles and ceramics.',
  'Tan mảng bám, cặn xà phòng và vết nước cứng; khử mùi, an toàn cho men gạch và thiết bị sứ.',
  'Dissolves limescale, soap scum and hard-water marks; deodorises and is safe on tiles and ceramics.',
  5
),
(
  'fridge-spray',
  'https://2sgroup.vn/wp-content/uploads/2025/04/e795fb7518a148b4984ec155955c1bcbtplv-o3syd03w52-origin-jpeg-1024x1024.jpeg',
  'Tủ lạnh',
  'Refrigerator',
  'Xịt vệ sinh tủ lạnh SU',
  'SU Refrigerator Cleaning Spray',
  'Làm sạch dịu nhẹ và khử mùi, giữ không gian trữ thực phẩm luôn thơm mát.',
  'Gentle cleaning and deodorising, keeping food storage fresh.',
  'Làm sạch an toàn cho khoang chứa thực phẩm, khử mùi và giữ tủ thơm mát lâu dài.',
  'Gentle cleaning that deodorises and keeps food storage fresh for longer.',
  6
);
