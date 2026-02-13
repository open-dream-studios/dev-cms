// project/src/modules/EstimationModule/_hooks/estimations.hooks.tsx
"use client";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { EstimationProcess } from "@/api/estimations/process/estimationProcess.api";
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import { useEstimationProcesses } from "@/contexts/queryContext/queries/estimations/process/estimationProcess";
import Modal2MultiStepModalInput, {
  StepConfig,
} from "@/modals/Modal2MultiStepInput";
import { useUiStore } from "@/store/useUIStore";
import { EstimationFactDefinition, FolderScope } from "@open-dream/shared";
import { useEstimationFactDefinitions } from "@/contexts/queryContext/queries/estimations/estimationFactDefinitions";
import { displayToKey } from "@/util/functions/Data";
import { useFoldersCurrentDataStore } from "@/modules/_util/Folders/_store/folders.store";
import { useEstimationsUIStore } from "../_store/estimations.store";

export function useEstimations() {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId, currentProcessId } = useCurrentDataStore();
  const { estimationProcesses, upsertEstimationProcess } =
    useEstimationProcesses(!!currentUser, currentProjectId);
  const { modal2, setModal2 } = useUiStore();
  const { variableView, setEditingFact } = useEstimationsUIStore();
  const { upsertFactDefinition } = useEstimationFactDefinitions(
    !!currentUser,
    currentProjectId!,
    currentProcessId,
  );
  const { selectedFoldersByScope } = useFoldersCurrentDataStore();

  const handleAddEstimationProcess = async (scope: FolderScope) => {
    if (!currentProjectId) return;
    const steps: StepConfig[] = [
      {
        name: "label",
        placeholder: "Label...",
        validate: (val) => (val.length > 1 ? true : "2+ chars"),
      },
    ];

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
          steps={steps}
          key={`trigger-${Date.now()}`}
          onComplete={async (values) => {
            await upsertEstimationProcess({
              process_id: null,
              label: values.label,
              folder_id: selectedFoldersByScope[scope]?.id ?? null,
            });
          }}
        />
      ),
    });
  };

  const handleEditEstimationProcess = (clickedProcess: EstimationProcess) => {
    const matchedProcess = estimationProcesses.find(
      (process: EstimationProcess) =>
        process.process_id === clickedProcess.process_id,
    );
    if (!matchedProcess) return;
    const EditProcessSteps: StepConfig[] = [
      {
        name: "label",
        initialValue: matchedProcess.label ?? "",
        placeholder: `Process Name...`,
        validate: (val) => (val.length >= 1 ? true : "1+ chars"),
      },
    ];

    const onComplete = async (values: any) => {
      await upsertEstimationProcess({
        ...matchedProcess,
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

  const handleAddEstimationVariable = (scope: FolderScope) => {
    const EditVariableSteps: StepConfig[] = [
      {
        name: "name",
        placeholder: `Variable Name...`,
        validate: (val) => (val.length >= 1 ? true : "1+ chars"),
      },
    ];

    const onComplete = async (values: any) => {
      const fact_key = displayToKey(values.name);
      if (!fact_key) return;

      const res = await upsertFactDefinition({
        fact_key,
        fact_type: "number",
        variable_scope: variableView,
        description: null,
        folder_id: selectedFoldersByScope[scope]?.id ?? null,
        process_id: currentProcessId!,
      });
      if (res.fact_id) {
        setEditingFact({
          var_key: fact_key,
          var_id: res.fact_id,
          var_type: variableView,
        });
      }
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
          key={`edit-fact-${Date.now()}`}
          steps={EditVariableSteps}
          onComplete={onComplete}
        />
      ),
    });
  };

  const handleEditEstimationVariable = (fact: EstimationFactDefinition) => {
    const EditFactSteps: StepConfig[] = [
      {
        name: "name",
        initialValue: fact.fact_key ?? "",
        placeholder: `Fact Name...`,
        validate: (val) => (val.length >= 1 ? true : "1+ chars"),
      },
      {
        name: "type",
        placeholder: `Fact Type...`,
        validate: (val) => {
          // const trimmed = val.trim();
          // if (trimmed === "") return "Enter a number";
          // const isValidNumber = /^\d+(\s*\.\s*\d+)?$/.test(
          //   trimmed.replace(/\s+/g, " "),
          // );
          // return isValidNumber ? true : "Invalid number";
          return true;
        },
      },
    ];

    const onComplete = async (values: any) => {
      await upsertFactDefinition({
        ...fact,
        fact_key: displayToKey(values.name),
        fact_type: values.type,
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
          key={`edit-fact-${Date.now()}`}
          steps={EditFactSteps}
          onComplete={onComplete}
        />
      ),
    });
  };

  return {
    handleAddEstimationProcess,
    handleEditEstimationProcess,
    handleAddEstimationVariable,
    handleEditEstimationVariable,
  };
}
