-- Adds a department code to each staff profile so the system knows "who
-- someone is" (mã phòng ban) without asking every time — used to prefill
-- the structured Lark file-naming form. Free-text column, not an enum/FK:
-- the department code list lives in the app (src/lib/admin/departments.ts)
-- and in the "PERMATE" naming-convention doc, matching how the doc itself
-- expects the code table to evolve without a schema migration each time.
alter table public.profiles add column department text;
