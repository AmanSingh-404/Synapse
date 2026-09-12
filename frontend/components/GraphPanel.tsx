"use client";

import { useEffect, useState, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import { Maximize2, Minimize2 } from "lucide-react";
import { api } from "@/lib/api";

type GraphNode = { id: string; name: string; type: string; file_path: string };
type GraphEdge = { source: string; target: string; type: string };

const TYPE_STYLE: Record<string, { border: string; dot: string }> = {
  file: { border: "#9CA3AF", dot: "#6B7280" },
  function: { border: "#60A5FA", dot: "#3B82F6" },
  class: { border: "#C084FC", dot: "#A855F7" },
};

const NODE_WIDTH = 170;
const NODE_HEIGHT = 44;

function layoutWithDagre(rawNodes: GraphNode[], rawEdges: GraphEdge[]) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 70 });
  g.setDefaultEdgeLabel(() => ({}));

  rawNodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  rawEdges.forEach((e) => g.setEdge(e.source, e.target));

  dagre.layout(g);

  const nodes: Node[] = rawNodes.map((n) => {
    const pos = g.node(n.id);
    const style = TYPE_STYLE[n.type] || TYPE_STYLE.file;
    return {
      id: n.id,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: { label: n.name, type: n.type },
      style: {
        background: "#fff",
        color: "var(--ink)",
        borderLeft: `4px solid ${style.border}`,
        border: "1px solid var(--line)",
        borderRadius: 8,
        fontSize: 11,
        padding: "8px 10px",
        width: NODE_WIDTH,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      },
    };
  });

  const edges: Edge[] = rawEdges.map((e, i) => ({
    id: `e${i}`,
    source: e.source,
    target: e.target,
    type: "smoothstep",
    animated: false,
    style: { stroke: "#D1D5DB", strokeWidth: 1.2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#D1D5DB", width: 14, height: 14 },
  }));

  return { nodes, edges };
}

function Legend() {
  const items = [
    { label: "File", color: TYPE_STYLE.file.dot },
    { label: "Function", color: TYPE_STYLE.function.dot },
    { label: "Class", color: TYPE_STYLE.class.dot },
  ];
  return (
    <div
      className="absolute top-3 left-3 z-10 flex items-center gap-4 px-3 py-2 rounded-lg text-xs"
      style={{ background: "#fff", border: "1px solid var(--line)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
    >
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
          <span className="w-2 h-2 rounded-full" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

export default function GraphPanel({ repoId, touchedNodeIds }: { repoId: string; touchedNodeIds: string[] }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nameToId, setNameToId] = useState<Record<string, string>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    api.getRepoGraph(repoId).then((data: { nodes: GraphNode[]; edges: GraphEdge[] }) => {
      const { nodes: laidOutNodes, edges: laidOutEdges } = layoutWithDagre(data.nodes, data.edges);
      setNodes(laidOutNodes);
      setEdges(laidOutEdges);
      const map: Record<string, string> = {};
      data.nodes.forEach((n) => (map[n.name] = n.id));
      setNameToId(map);
    });
  }, [repoId, setNodes, setEdges]);

  useEffect(() => {
    if (touchedNodeIds.length === 0) return;
    const touchedIds = new Set(touchedNodeIds.map((name) => nameToId[name]).filter(Boolean));

    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        style: {
          ...n.style,
          boxShadow: touchedIds.has(n.id) ? "0 0 0 2px #F5B942, 0 2px 8px rgba(245,185,66,0.3)" : "0 1px 3px rgba(0,0,0,0.06)",
        },
      }))
    );
  }, [touchedNodeIds, nameToId, setNodes]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsFullscreen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const minimapNodeColor = useMemo(
    () => (n: Node) => {
      const type = (n.data as { type?: string })?.type;
      return TYPE_STYLE[type || "file"]?.dot || "#9CA3AF";
    },
    []
  );

  return (
    <div
      style={
        isFullscreen
          ? { position: "fixed", inset: 0, zIndex: 50, background: "#fff" }
          : { height: "100%", width: "100%", position: "relative" }
      }
    >
      <Legend />

      <button
        onClick={() => setIsFullscreen((f) => !f)}
        className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
        style={{ background: "#fff", border: "1px solid var(--line)", color: "var(--ink)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
      >
        {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      </button>

      <ReactFlow
        key={isFullscreen ? "fs" : "normal"}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        defaultViewport={{ x: 50, y: 50, zoom: 0.7 }}
        minZoom={0.1}
      >
        <Background color="var(--line)" gap={20} />
        <Controls />
        <MiniMap nodeColor={minimapNodeColor} maskColor="rgba(0,0,0,0.03)" style={{ border: "1px solid var(--line)" }} />
      </ReactFlow>
    </div>
  );
}