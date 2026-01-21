// src/pemdas/components/PemdasCanvas.tsx
import { PemdasNode, Edge } from "../types";
import PemdasNodeView from "./PemdasNodeView";

export default function PemdasCanvas({
  nodes,
  edges,
  onDrop,
}: {
  nodes: PemdasNode[];
  edges: Edge[];
  onDrop: (x: number, y: number) => void;
}) {
  return (
    <div
      className="flex-1 relative bg-neutral-950"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onDrop(e.clientX - rect.left, e.clientY - rect.top);
      }}
    >
      {nodes.map((n) => (
        <div
          key={n.id}
          style={{ left: n.x, top: n.y }}
          className="absolute"
        >
          <PemdasNodeView node={n} />
        </div>
      ))}
    </div>
  );
}