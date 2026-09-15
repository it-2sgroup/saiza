-- Splits the single canvas into multiple independent charts (one per
-- organization — see the "Sơ đồ tổ chức" tabs) — SISMO's structure and
-- SAIZA's structure are two different companies, not two branches of the
-- same tree. Edges and members don't need their own chart_key: an edge only
-- ever connects two nodes the app itself created within the same chart
-- (enforced in the picker, not the DB), and a membership is scoped through
-- its node_id already.
alter table public.org_chart_nodes
  add column chart_key text not null default 'saiza';

create index org_chart_nodes_chart_key_idx on public.org_chart_nodes (chart_key);
