// project/src/modules/EstimationModule/PricingAdmin/PricingGraphDetail.tsx
"use client";

import { useEffect, useState } from "react";
import {
  usePricingGraphs,
  usePricingNodes,
} from "@/contexts/queryContext/queries/estimations/pricing";
import { useCurrentDataStore } from "@/store/currentDataStore";
import PricingNodeEditor from "./PricingNodeEditor";

export default function PricingGraphDetail({
  graphIdx,
}: {
  graphIdx: number;
}) {
  const { currentProjectId } = useCurrentDataStore();
  const pricingGraphs = usePricingGraphs();
  const pricingNodes = usePricingNodes();
  const [nodes, setNodes] = useState<any[]>([]);

  useEffect(() => {
    if (!currentProjectId) return;

    pricingNodes.list.mutate(
      { project_idx: currentProjectId, graph_idx: graphIdx },
      { onSuccess: setNodes }
    );
  }, [currentProjectId, graphIdx]);

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Pricing Nodes</h2>
        <button
          className="px-4 py-2 bg-black text-white rounded"
          onClick={() =>
            pricingGraphs.publish.mutate({
              project_idx: currentProjectId!,
              graph_idx: graphIdx,
            })
          }
        >
          Publish Graph
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {nodes.map((n) => (
          <PricingNodeEditor
            key={n.id}
            node={n}
            graphIdx={graphIdx}
            onSave={() =>
              pricingNodes.list.mutate(
                { project_idx: currentProjectId!, graph_idx: graphIdx },
                { onSuccess: setNodes }
              )
            }
          />
        ))}

        <PricingNodeEditor
          isNew
          graphIdx={graphIdx}
          onSave={() =>
            pricingNodes.list.mutate(
              { project_idx: currentProjectId!, graph_idx: graphIdx },
              { onSuccess: setNodes }
            )
          }
        />
      </div>
    </div>
  );
}