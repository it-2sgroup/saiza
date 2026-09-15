"use server";

import { getCurrentProfile } from "@/lib/supabase/profile";
import { canManageStaff } from "@/lib/admin/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

// The canvas is edited live (drag, connect, rename) with the client holding
// its own React Flow state — these actions are fire-and-forget persistence,
// not the source of truth for what's on screen. None of them call
// revalidatePath: doing that after every drag/connect would force a full
// server round-trip and re-render mid-gesture, which reads as the canvas
// "jumping" — the opposite of what a Miro-style editor should feel like.
// The DB is only ever re-read on the next real page load.
async function requireEdit(): Promise<{ error: string } | null> {
  const profile = await getCurrentProfile();
  if (!profile || !(await canManageStaff(profile.role)))
    return { error: "Bạn không có quyền chỉnh sửa sơ đồ tổ chức." };
  return null;
}

export async function createNodeAction(
  chartKey: string,
  label: string,
  color: string,
  x: number,
  y: number,
): Promise<{ id: string } | { error: string }> {
  const denied = await requireEdit();
  if (denied) return denied;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("org_chart_nodes")
    .insert({ chart_key: chartKey, label, color, position_x: x, position_y: y })
    .select("id")
    .single();
  if (error || !data) return { error: "Không tạo được ô." };
  return { id: data.id as string };
}

export async function updateNodePositionAction(
  id: string,
  x: number,
  y: number,
): Promise<void> {
  if (await requireEdit()) return;
  const admin = createAdminClient();
  await admin
    .from("org_chart_nodes")
    .update({ position_x: x, position_y: y, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function updateNodeAction(
  id: string,
  label: string,
  color: string,
): Promise<{ error: string | null }> {
  const denied = await requireEdit();
  if (denied) return denied;
  const admin = createAdminClient();
  const { error } = await admin
    .from("org_chart_nodes")
    .update({ label, color, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error: error ? "Không lưu được thay đổi." : null };
}

export async function deleteNodeAction(id: string): Promise<{ error: string | null }> {
  const denied = await requireEdit();
  if (denied) return denied;
  const admin = createAdminClient();
  // Cascades to org_chart_edges and org_chart_node_members via FK — deleting
  // a box removes its connections and member list with it, not just itself.
  const { error } = await admin.from("org_chart_nodes").delete().eq("id", id);
  return { error: error ? "Không xoá được ô." : null };
}

export async function createEdgeAction(
  sourceNodeId: string,
  targetNodeId: string,
): Promise<{ id: string } | { error: string }> {
  const denied = await requireEdit();
  if (denied) return denied;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("org_chart_edges")
    .insert({ source_node_id: sourceNodeId, target_node_id: targetNodeId })
    .select("id")
    .single();
  if (error || !data) return { error: "Không nối được — có thể đường nối này đã tồn tại." };
  return { id: data.id as string };
}

export async function deleteEdgeAction(id: string): Promise<void> {
  if (await requireEdit()) return;
  const admin = createAdminClient();
  await admin.from("org_chart_edges").delete().eq("id", id);
}

export async function addNodeMemberAction(
  nodeId: string,
  email: string,
  fullName: string,
  avatarUrl: string | null,
  orgLabel: string | null,
): Promise<{ id: string } | { error: string }> {
  const denied = await requireEdit();
  if (denied) return denied;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("org_chart_node_members")
    .upsert(
      { node_id: nodeId, lark_email: email, full_name: fullName, avatar_url: avatarUrl, org_label: orgLabel },
      { onConflict: "node_id,lark_email" },
    )
    .select("id")
    .single();
  if (error || !data) return { error: "Không thêm được thành viên." };
  return { id: data.id as string };
}

export async function removeNodeMemberAction(id: string): Promise<void> {
  if (await requireEdit()) return;
  const admin = createAdminClient();
  await admin.from("org_chart_node_members").delete().eq("id", id);
}
