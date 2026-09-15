import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  listOrgContactsForStaffPicker,
  type OrgContact,
} from "@/lib/lark/contactsCache";

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
  // never get one at all.
  contacts: OrgContact[];
};

export async function getOrgChartData(): Promise<OrgChartData> {
  const admin = createAdminClient();
  const [{ data: nodesRaw }, { data: edgesRaw }, { data: membersRaw }, contacts] =
    await Promise.all([
      admin
        .from("org_chart_nodes")
        .select("id, label, color, position_x, position_y"),
      admin.from("org_chart_edges").select("id, source_node_id, target_node_id"),
      admin
        .from("org_chart_node_members")
        .select("id, node_id, lark_email, full_name, avatar_url, org_label"),
      listOrgContactsForStaffPicker().catch(() => []),
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
