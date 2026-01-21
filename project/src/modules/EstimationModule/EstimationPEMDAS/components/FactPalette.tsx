// src/pemdas/components/FactPalette.tsx
import { FactNode } from "../types";

export default function FactPalette({
  facts,
  onDragStart,
}: {
  facts: FactNode[];
  onDragStart: (fact: FactNode) => void;
}) {
  return (
    <div className="w-[240px] p-3 border-r bg-neutral-900 text-white">
      <h3 className="text-sm font-semibold mb-3">Facts</h3>
      <div className="flex flex-col gap-2">
        {facts.map((f) => (
          <div
            key={f.id}
            draggable
            onDragStart={() => onDragStart(f)}
            className="px-3 py-2 rounded bg-neutral-800 cursor-grab hover:bg-neutral-700"
          >
            <div className="text-xs opacity-70">{f.key}</div>
            <div className="text-sm">
              {f.value ?? <span className="opacity-40">undefined</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}