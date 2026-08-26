-- Per-employee default settings for the Lark file-naming form (which
-- prefixes — Phòng ban/Loại tài liệu/Ngày/Version — are included by default,
-- plus a couple of default picks). Free-form JSON, not individual columns:
-- the set of tunable naming options is expected to keep growing, and JSONB
-- lets the app add new keys without another migration each time (matching
-- the same reasoning as `department` in 0010 being a free-text code, not
-- an enum/FK to a fixed table).
alter table public.profiles add column lark_prefs jsonb not null default '{}'::jsonb;
