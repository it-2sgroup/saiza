"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type Edge,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { OrgChartNode, type OrgFlowNode, type OrgNodeData } from "./OrgChartNode";
import { Btn } from "../controls";
import {
  createNodeAction,
  updateNodePositionAction,
  updateNodeAction,
  deleteNodeAction,
  createEdgeAction,
  deleteEdgeAction,
  addNodeMemberAction,
  removeNodeMemberAction,
} from "./actions";
import type { OrgChartData, OrgChartMember, OrgChartNode as OrgChartNodeRow } from "./data";
import type { OrgContact } from "@/lib/lark/contactsCache";
import { NODE_COLOR_PRESETS } from "./colors";

const nodeTypes = { orgNode: OrgChartNode };

type Handlers = Pick<
  OrgNodeData,
  "onRename" | "onDelete" | "onAddMember" | "onRemoveMember"
>;

function buildFlowNode(
  n: OrgChartNodeRow,
  members: OrgChartMember[],
  canEdit: boolean,
  contacts: OrgContact[],
  handlers: Handlers,
): OrgFlowNode {
  return {
    id: n.id,
    type: "orgNode",
    position: { x: n.positionX, y: n.positionY },
    data: {
      label: n.label,
      color: n.color,
      members: members.filter((m) => m.nodeId === n.id),
      canEdit,
      contacts,
      ...handlers,
    },
  };
}

function OrgChartCanvas({
  chartKey,
  data,
  canEdit,
}: {
  chartKey: string;
  data: OrgChartData;
  canEdit: boolean;
}) {
  const [edges, setEdges] = useState<Edge[]>(() =>
    data.edges.map((e) => ({
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      type: "smoothstep",
    })),
  );
  // Indirection so `handlers` (needed to build the very first `nodes` state
  // below) can call setNodes before setNodes technically exists yet —
  // assigned for real right after the useState call, every render, so by
  // the time any handler actually RUNS (a user interaction, never during
  // this initial render) the ref always points at the current setter.
  const setNodesRef = useRef<(updater: (nds: OrgFlowNode[]) => OrgFlowNode[]) => void>(
    () => {},
  );

  const [handlers] = useState<Handlers>(() => ({
    onRename: (id, label, color) => {
      setNodesRef.current((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label, color } } : n)),
      );
      void updateNodeAction(id, label, color);
    },
    onDelete: (id) => {
      setNodesRef.current((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      void deleteNodeAction(id);
    },
    onAddMember: (nodeId, contact) => {
      const orgLabel = contact.orgLabel ?? null;
      void addNodeMemberAction(
        nodeId,
        contact.email,
        contact.full_name,
        contact.avatar_url,
        orgLabel,
      ).then((res) => {
        if ("error" in res) return;
        const newMember: OrgChartMember = {
          id: res.id,
          nodeId,
          email: contact.email,
          fullName: contact.full_name,
          avatarUrl: contact.avatar_url,
          orgLabel,
        };
        setNodesRef.current((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, members: [...n.data.members, newMember] } }
              : n,
          ),
        );
      });
    },
    onRemoveMember: (memberId) => {
      setNodesRef.current((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, members: n.data.members.filter((m) => m.id !== memberId) },
        })),
      );
      void removeNodeMemberAction(memberId);
    },
  }));

  const [nodes, setNodes] = useState<OrgFlowNode[]>(() =>
    data.nodes.map((n) => buildFlowNode(n, data.members, canEdit, data.contacts, handlers)),
  );
  // "Latest ref" pattern (React's own recommended way to do this) — setNodes
  // itself is stable across renders, but assigning to a ref during render is
  // disallowed, so the sync happens here instead.
  useEffect(() => {
    setNodesRef.current = setNodes;
  }, [setNodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange<OrgFlowNode>[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const c of changes) {
        if (c.type === "remove") void deleteEdgeAction(c.id);
      }
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [],
  );
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    setEdges((eds) => addEdge({ ...connection, type: "smoothstep" }, eds));
    void createEdgeAction(connection.source, connection.target);
  }, []);

  const onNodeDragStop = useCallback((_: unknown, node: OrgFlowNode) => {
    void updateNodePositionAction(node.id, node.position.x, node.position.y);
  }, []);

  // Same leaf-first tree layout as the one-off seed script, but using each
  // box's REAL rendered width (React Flow measures every node via
  // ResizeObserver and feeds it back through onNodesChange's "dimensions"
  // changes into node.measured) instead of a guess — the guess is what
  // caused boxes with long names/many members to overlap their neighbors
  // in the first place. Safe to re-run anytime content changes size.
  const AUTO_MARGIN = 70;
  const AUTO_LEVEL_HEIGHT = 460;
  const autoArrange = useCallback(() => {
    const childrenOf = new Map<string, string[]>();
    const hasParent = new Set<string>();
    for (const e of edges) {
      if (!e.source || !e.target) continue;
      if (!childrenOf.has(e.source)) childrenOf.set(e.source, []);
      childrenOf.get(e.source)!.push(e.target);
      hasParent.add(e.target);
    }
    const roots = nodes.map((n) => n.id).filter((id) => !hasParent.has(id));
    const widthOf = new Map(nodes.map((n) => [n.id, n.measured?.width ?? 220]));

    let cursor = 0;
    const posX = new Map<string, number>();
    const posY = new Map<string, number>();
    function place(id: string, depth: number): number {
      posY.set(id, depth * AUTO_LEVEL_HEIGHT);
      const kids = childrenOf.get(id) ?? [];
      const w = widthOf.get(id) ?? 220;
      if (kids.length === 0) {
        const x = cursor + w / 2;
        posX.set(id, x);
        cursor += w + AUTO_MARGIN;
        return x;
      }
      const childXs = kids.map((k) => place(k, depth + 1));
      const avg = (Math.min(...childXs) + Math.max(...childXs)) / 2;
      posX.set(id, avg);
      return avg;
    }
    for (const r of roots) place(r, 0);
    for (const n of nodes) {
      if (!posX.has(n.id)) {
        const w = widthOf.get(n.id) ?? 220;
        posX.set(n.id, cursor + w / 2);
        posY.set(n.id, 0);
        cursor += w + AUTO_MARGIN;
      }
    }

    setNodes((nds) =>
      nds.map((n) => ({ ...n, position: { x: posX.get(n.id)!, y: posY.get(n.id)! } })),
    );
    for (const n of nodes) {
      void updateNodePositionAction(n.id, posX.get(n.id)!, posY.get(n.id)!);
    }
  }, [nodes, edges]);

  const addNode = useCallback(async () => {
    const x = 80 + Math.random() * 300;
    const y = 60 + Math.random() * 200;
    const res = await createNodeAction(chartKey, "Ô mới", NODE_COLOR_PRESETS[3], x, y);
    if ("error" in res) return;
    setNodes((nds) => [
      ...nds,
      buildFlowNode(
        { id: res.id, label: "Ô mới", color: NODE_COLOR_PRESETS[3], positionX: x, positionY: y },
        [],
        canEdit,
        data.contacts,
        handlers,
      ),
    ]);
  }, [chartKey, canEdit, data.contacts, handlers]);

  return (
    <div className="relative h-[calc(100vh-190px)] w-full overflow-hidden rounded-2xl border border-line bg-wash">
      {canEdit && (
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          <Btn size="sm" variant="primary" onClick={() => void addNode()}>
            + Thêm ô
          </Btn>
          <Btn
            size="sm"
            variant="secondary"
            onClick={autoArrange}
            title="Xếp lại toàn bộ ô theo cây, tự né chồng lấn dựa trên kích thước thật"
          >
            Tự sắp xếp
          </Btn>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={canEdit ? onNodesChange : undefined}
        onEdgesChange={canEdit ? onEdgesChange : undefined}
        onConnect={canEdit ? onConnect : undefined}
        onNodeDragStop={canEdit ? onNodeDragStop : undefined}
        nodesDraggable={canEdit}
        nodesConnectable={canEdit}
        elementsSelectable={canEdit}
        fitView
        minZoom={0.2}
      >
        <Background gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

// ReactFlowProvider is required for hooks like useReactFlow elsewhere in the
// tree — not used directly here yet, but every React Flow example wraps at
// this boundary, and adding it later would remount (losing viewport/zoom).
export function OrgChartEditor(props: {
  chartKey: string;
  data: OrgChartData;
  canEdit: boolean;
}) {
  return (
    <ReactFlowProvider>
      <OrgChartCanvas {...props} />
    </ReactFlowProvider>
  );
}
