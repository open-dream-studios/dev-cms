// src/pemdas/components/PemdasNodeView.tsx
import { PemdasNode } from "../types";

export default function PemdasNodeView({
  node,
}: {
  node: PemdasNode;
}) {
  if (node.type === "fact") {
    return (
      <div className="px-3 py-2 rounded bg-neutral-800 text-white">
        FACT
      </div>
    );
  }

  if (node.type === "operator") {
    return (
      <div className="w-10 h-10 flex items-center justify-center rounded bg-blue-600 text-white">
        {node.operator}
      </div>
    );
  }

  return (
    <div className="px-4 py-2 rounded border border-dashed border-neutral-500 text-neutral-300">
      ( )
    </div>
  );
}