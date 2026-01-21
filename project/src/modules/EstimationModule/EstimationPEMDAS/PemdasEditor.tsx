// src/pemdas/PemdasEditor.tsx
import { useState } from "react";
import { mockFacts } from "./mockFacts";
import { uid } from "./utils";
import {
  PemdasNode,
  Operator,
  FactNode,
} from "./types";

import FactPalette from "./components/FactPalette";
import OperatorPalette from "./components/OperatorPalette";
import PemdasCanvas from "./components/PemdasCanvas";

export default function PemdasEditor() {
  const [nodes, setNodes] = useState<PemdasNode[]>([]);
  const [dragFact, setDragFact] = useState<FactNode | null>(null);
  const [dragOp, setDragOp] = useState<Operator | null>(null);

  const handleDrop = (x: number, y: number) => {
    if (dragFact) {
      setNodes((n) => [
        ...n,
        {
          id: uid(),
          type: "fact",
          factId: dragFact.id,
          x,
          y,
        },
      ]);
      setDragFact(null);
    }

    if (dragOp) {
      setNodes((n) => [
        ...n,
        {
          id: uid(),
          type: "operator",
          operator: dragOp,
          x,
          y,
        },
      ]);
      setDragOp(null);
    }
  };

  return (
    <div className="w-full h-full flex">
      <FactPalette
        facts={mockFacts}
        onDragStart={setDragFact}
      />

      <div className="flex-1 flex flex-col">
        <div className="p-3 border-b bg-neutral-900 text-white">
          <OperatorPalette onDragStart={setDragOp} />
        </div>

        <PemdasCanvas
          nodes={nodes}
          edges={[]}
          onDrop={handleDrop}
        />
      </div>
    </div>
  );
}