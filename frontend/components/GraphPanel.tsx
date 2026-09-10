"use client";

import { useEffect, useState, useCallback } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { api } from "@/lib/api";

type GraphNode = { id: string; name: string; type: string; file_path: string };
type GraphEdge = { source: string; target: string; type: string };

const TYPE_COLORS: Record<string, string> = {
  file: "#525252",
  function: "#3b82f6",
  class: "#a855f7",
};

function layoutNodes(rawNodes: GraphNode[]): Node[] {
  // Simple grid layout — good enough for a demo; a force-directed layout
  // (e.g. dagre) would look better for larger graphs but adds a dependency.
  const cols = Math.ceil(Math.sqrt(rawNodes.length));
  return rawNodes.map((n, i) => ({
    id: n.id,
    position: { x: (i % cols) * 180, y: Math.floor(i / cols) * 100 },
    data: { label: n.name },
    style: {
      background: TYPE_COLORS[n.type] || "#525252",
      color: "white",
      border: "1px solid #333",
      borderRadius: 6,
      fontSize: 11,
      padding: 6,
      width: 150,
    },
  }));
}

function layoutEdges(rawEdges: GraphEdge[]): Edge[] {
  return rawEdges.map((e, i) => ({
    id: `e${i}`,
    source: e.source,
    target: e.target,
    label: e.type,
    style: { stroke: "#444" },
    labelStyle: { fill: "#666", fontSize: 9 },
  }));
}

export default function GraphPanel({ repoId, touchedNodeIds }: { repoId: string; touchedNodeIds: string[] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nameToId, setNameToId] = useState<Record<string, string>>({});

  useEffect(() => {
    api.getRepoGraph(repoId).then((data: { nodes: GraphNode[]; edges: GraphEdge[] }) => {
      setNodes(layoutNodes(data.nodes));
      setEdges(layoutEdges(data.edges));
      const map: Record<string, string> = {};
      data.nodes.forEach((n) => (map[n.name] = n.id));
      setNameToId(map);
    });
  }, [repoId, setNodes, setEdges]);

  // Highlight touched nodes whenever the agent answers a new question
  useEffect(() => {
    if (touchedNodeIds.length === 0) return;
    const touchedIds = new Set(touchedNodeIds.map((name) => nameToId[name]).filter(Boolean));

    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        style: {
          ...n.style,
          boxShadow: touchedIds.has(n.id) ? "0 0 0 3px #facc15" : "none",
        },
      }))
    );
  }, [touchedNodeIds, nameToId, setNodes]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background color="#222" />
        <Controls />
      </ReactFlow>
    </div>
  );
}