// project/src/modules/EstimationModule/components/EstimationsLeftBar.tsx
import { AuthContext } from "@/contexts/authContext";
import { useEstimationFactDefinitions } from "@/contexts/queryContext/queries/estimations/estimationFactDefinitions";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useCurrentDataStore } from "@/store/currentDataStore";
import React, { useContext } from "react"; 
import { useDraggable } from "@dnd-kit/core"; 
import FactDraggableItem from "./FactDraggableItem";

export function useVarDraggable(params: {
  id: string;
  variable: string;
  value?: number;
}) {
  return useDraggable({
    id: params.id,
    data: {
      variable: params.variable,
      value: params.value ?? null,
    },
  });
}

const EstimationsLeftBar = () => {
  const currentTheme = useCurrentTheme();
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId } = useCurrentDataStore();

  const { factDefinitions, upsertFactDefinition, deleteFactDefinition } =
    useEstimationFactDefinitions(!!currentUser, currentProjectId);

  return (
    <div
      style={{
        backgroundColor: currentTheme.background_1,
        borderRight: "0.5px solid " + currentTheme.background_2,
      }}
      className="w-full h-full"
    >
      <div className="p-3 flex flex-col gap-2 h-full">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="font-semibold">Fact Definitions</div>
          <button
            className="px-2 py-1 rounded-md text-sm cursor-pointer hover:brightness-88 dim"
            style={{ backgroundColor: currentTheme.background_2 }}
            onClick={async () => {
              const fact_key = prompt("fact_key? (snake_case)")?.trim();
              if (!fact_key) return;

              const raw = (
                prompt("fact_type? boolean|number|string|enum") || "string"
              )
                .trim()
                .toLowerCase();

              const fact_type =
                raw === "boolean" ||
                raw === "number" ||
                raw === "string" ||
                raw === "enum"
                  ? raw
                  : "string";

              await upsertFactDefinition({
                fact_key,
                fact_type: fact_type as any,
                description: null,
                folder_id: "2",
                process_id: "2",
              });
            }}
          >
            + Add
          </button>
        </div>

        {/* FACT LIST */}
        <div className="flex flex-col gap-[5px] h-full overflow-auto">
          {factDefinitions.map((f) => (
            <FactDraggableItem
              key={f.fact_id}
              fact={f}
              onDelete={() => deleteFactDefinition(f.fact_id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default EstimationsLeftBar;
