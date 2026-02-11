// src/modules/EstimationModule/components/ProcessDraggableItem.tsx
import { EstimationProcess } from "@/api/estimations/process/estimationProcess.api";
import { useContextMenuStore } from "@/store/util/contextMenuStore";
import { useDraggable } from "@dnd-kit/core"; 
import { createEstimationProcessContextMenu } from "../_actions/estimations.actions"; 
import ProcessDisplay from "./ProcessDisplay";
import { useEstimations } from "../_hooks/estimations.hooks";

export default function ProcessDraggableItem({
  estimationProcess,
  index,
}: {
  estimationProcess: EstimationProcess;
  index: number;
}) {
  const { openContextMenu } = useContextMenuStore();
  const { handleEditEstimationProcess } = useEstimations();

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `process-${estimationProcess.process_id}`,
    data: {
      kind: "FOLDER-ITEM-PROCESS",
      item: estimationProcess,
    },
    disabled: false,
  });

  return (
    <div className="w-[100%] h-[100%] relative">
      <div
        ref={setNodeRef}
        data-draggable
        {...attributes}
        {...listeners}
        // onClick={() => {
        //   if (selectingVariable && pendingVariableTarget) {
        //     pendingVariableTarget.set({
        //       kind: "variable",
        //       var_key: fact.fact_key,
        //       var_id: fact.fact_id,
        //       var_type: fact.variable_scope,
        //       selector_id: selectingVariableReturn.selector_id,
        //     });

        //     setPendingVariableTarget(null);
        //     setSelectingVariableReturn(null);
        //   } else {
        //     const editItem = {
        //       var_key: fact.fact_key,
        //       var_id: fact.fact_id,
        //       var_type: fact.variable_scope,
        //     };
        //     if (fact.variable_scope === "fact") {
        //       setEditingFact(editItem);
        //     } else {
        //       openVariableIfTree(editItem);
        //     }
        //   }
        // }}
        style={{
          touchAction: "none",
          cursor: "grab",
          opacity: isDragging ? 0 : 1,
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          openContextMenu({
            position: { x: e.clientX, y: e.clientY },
            target: estimationProcess,
            menu: createEstimationProcessContextMenu(
              handleEditEstimationProcess,
            ),
          });
        }}
      >
        <ProcessDisplay
          key={index}
          estimationProcess={estimationProcess}
          index={index}
        />
      </div>
    </div>
  );
}
