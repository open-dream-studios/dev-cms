// project/src/modules/EstimationModule/components/ProcessDisplay.tsx
"use client";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { ChevronRight, GripVertical } from "lucide-react";
import { resetVariableUI } from "../_store/estimations.store";
import { nodeColors } from "../EstimationPEMDAS/_constants/pemdas.constants";
import { useContextMenuStore } from "@/store/util/contextMenuStore";
import { EstimationProcess } from "@/api/estimations/process/estimationProcess.api";
import { createEstimationProcessContextMenu } from "../_actions/estimations.actions";
import { useEstimations } from "../_hooks/estimations.hooks";

export const ProcessDisplay = ({
  estimationProcess,
  index,
}: {
  estimationProcess: EstimationProcess;
  index: number;
}) => {
  const currentTheme = useCurrentTheme();
  const { openContextMenu } = useContextMenuStore();
  const { setCurrentProcessId } = useCurrentDataStore();
  const { handleEditEstimationProcess } = useEstimations();

  return (
    <div
      className="w-[100%] h-[34px] mb-[4px] flex justify-between items-center gap-2 pr-[8px] pl-[11px] rounded-[5px] cursor-grab hover:brightness-90 dim"
      style={{
        borderLeft: "1.5px solid " + nodeColors["fact"],
        backgroundColor: currentTheme.background_2_dim,
      }}
      onClick={() => {
        setCurrentProcessId(estimationProcess.id);
        resetVariableUI();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        openContextMenu({
          position: { x: e.clientX, y: e.clientY },
          target: estimationProcess,
          menu: createEstimationProcessContextMenu(handleEditEstimationProcess),
        });
      }}
    >
      <div className="h-[100%] flex flex-row gap-[8px] items-center">
        <GripVertical size={14} />
        <span className="truncate select-none font-[500] opacity-90">
          {estimationProcess.label
            ? estimationProcess.label
            : "Process " + (index + 1)}
        </span>
      </div>
      <ChevronRight size={14} />
    </div>
  );
};

export default ProcessDisplay;
