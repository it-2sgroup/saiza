import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  listOrgContactsForStaffPicker,
  type OrgContact,
} from "@/lib/lark/contactsCache";

// Each chart is a fully separate canvas — SISMO and SAIZA are different
// companies with different structures, not two branches of one tree. Keyed
// by a short slug (also what org_chart_nodes.chart_key stores), not the
// Lark app key: a chart's boxes don't have to line up 1:1 with a Lark
// tenant (SAIZA's chart already draws members from 2sgroup/saiza-user/
// 2s-ctv/zensip all at once).
export const ORG_CHARTS = [
  { key: "sismo", label: "SISMO" },
  { key: "saiza", label: "SAIZA" },
] as const;
export type OrgChartKey = (typeof ORG_CHARTS)[number]["key"];

export type OrgChartNode = {
  id: string;
  label: string;
  color: string;
  positionX: number;
  positionY: number;
};

export type OrgChartEdge = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
};

export type OrgChartMember = {
  id: string;
  nodeId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  orgLabel: string | null;
};

export type OrgChartData = {
  nodes: OrgChartNode[];
  edges: OrgChartEdge[];
  members: OrgChartMember[];
  // Every real Lark account across all 5 connected orgs — the pool the
  // "add member to this box" picker searches. Not scoped to people who have
  // a website login (nhan-su's `profiles`): most names on a real org chart
  // never get one at all. Shared across every chart tab — SISMO's canvas
  // can still pull in someone whose account happens to live in a different
  // Lark tenant.
  contacts: OrgContact[];
};

export async function getOrgChartData(chartKey: OrgChartKey): Promise<OrgChartData> {
  const admin = createAdminClient();
  const [{ data: nodesRaw }, contacts] = await Promise.all([
    admin
      .from("org_chart_nodes")
      .select("id, label, color, position_x, position_y")
      .eq("chart_key", chartKey),
    listOrgContactsForStaffPicker().catch(() => []),
  ]);

  const nodeIds = (nodesRaw ?? []).map((n) => n.id as string);
  const [{ data: edgesRaw }, { data: membersRaw }] =
    nodeIds.length === 0
      ? [{ data: [] }, { data: [] }]
      : await Promise.all([
          // Edges have no chart_key of their own — scoped by only keeping
          // ones whose ends both belong to a node we just fetched for this
          // chart. Two .in() filters (not a join) since source/target can't
          // both be expressed in one PostgREST filter.
          admin
            .from("org_chart_edges")
            .select("id, source_node_id, target_node_id")
            .in("source_node_id", nodeIds)
            .in("target_node_id", nodeIds),
          admin
            .from("org_chart_node_members")
            .select("id, node_id, lark_email, full_name, avatar_url, org_label")
            .in("node_id", nodeIds),
        ]);

  return {
    nodes: (nodesRaw ?? []).map((n) => ({
      id: n.id as string,
      label: n.label as string,
      color: n.color as string,
      positionX: n.position_x as number,
      positionY: n.position_y as number,
    })),
    edges: (edgesRaw ?? []).map((e) => ({
      id: e.id as string,
      sourceNodeId: e.source_node_id as string,
      targetNodeId: e.target_node_id as string,
    })),
    members: (membersRaw ?? []).map((m) => ({
      id: m.id as string,
      nodeId: m.node_id as string,
      email: m.lark_email as string,
      fullName: m.full_name as string,
      avatarUrl: m.avatar_url as string | null,
      orgLabel: m.org_label as string | null,
    })),
    contacts,
  };
}
