// src/modules/EstimationModule/components/ProcessDraggableItem.tsx
import { EstimationProcess } from "@/api/estimations/process/estimationProcess.api";
import { AuthContext } from "@/contexts/authContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { useContextMenuStore } from "@/store/util/contextMenuStore";
import { useContext } from "react"; 
import { useDraggable } from "@dnd-kit/core";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { createEstimationProcessContextMenu } from "../_helpers/estimations.helpers";
import { useEstimationProcesses } from "@/contexts/queryContext/queries/estimations/process/estimationProcess";
import { EstimationProcessItem } from "./EstimationsLeftBar";

export default function ProcessDraggableItem({
  estimationProcess,
  index,
}: {
  estimationProcess: EstimationProcess;
  index: number;
}) {
  const { currentUser } = useContext(AuthContext);
  const { openContextMenu } = useContextMenuStore();
  const { currentProjectId } = useCurrentDataStore();
  const { modal2, setModal2 } = useUiStore();

  const { upsertEstimationProcess } = useEstimationProcesses(
    !!currentUser,
    currentProjectId,
  );

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `item-${estimationProcess.process_id}`,
    data: {
      kind: "FOLDER-ITEM-PROCESS",
      item: estimationProcess,
    },
    disabled: false,
  });

  const handleEditProcess = (process: EstimationProcess) => {
    const EditProcessSteps: StepConfig[] = [
      {
        name: "label",
        initialValue: process.label ?? "",
        placeholder: `Fact Name...`,
        validate: (val) => (val.length >= 1 ? true : "1+ chars"),
      },
    ];

    const onComplete = async (values: any) => {
      await upsertEstimationProcess({
        ...process,
        label: values.label,
      });
    };

    setModal2({
      ...modal2,
      open: true,
      showClose: false,
      offClickClose: true,
      width: "w-[300px]",
      maxWidth: "max-w-[400px]",
      aspectRatio: "aspect-[5/2]",
      borderRadius: "rounded-[12px] md:rounded-[15px]",
      content: (
        <Modal2MultiStepModalInput
          key={`edit-process-${Date.now()}`}
          steps={EditProcessSteps}
          onComplete={onComplete}
        />
      ),
    });
  };

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
            menu: createEstimationProcessContextMenu(handleEditProcess),
          });
        }}
      >
        <EstimationProcessItem
          key={index}
          estimationProcess={estimationProcess}
          index={index}
        />
      </div>
    </div>
  );
}
