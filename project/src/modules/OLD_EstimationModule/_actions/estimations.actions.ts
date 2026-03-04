// project/src/modules/EstimationModule/_actions/estimations.actions.tsx
import { deleteFactDefinitionApi } from "@/api/estimations/estimationFactDefinitions.api";
import { queryClient } from "@/lib/queryClient";
import { useCurrentDataStore } from "@/store/currentDataStore";
import {
  ContextMenuDefinition,
  EstimationFactDefinition,
} from "@open-dream/shared";
import { deleteEstimationProcessApi, EstimationProcess } from "@/api/estimations/process/estimationProcess.api";

export const createFactDefinitionContextMenu = (
  onEdit: (fact: EstimationFactDefinition) => void
): ContextMenuDefinition<EstimationFactDefinition> => ({
  items: [
    {
      id: "edit-fact",
      label: "Edit",
      onClick: (fact) => onEdit(fact),
    },
    {
      id: "delete-fact",
      label: "Delete",
      danger: true,
      onClick: async (fact) => {
        await handleDeleteFact(fact.fact_id);
      },
    },
  ],
});

export const handleDeleteFact = async (fact_id: string) => {
  const { currentProjectId, currentProcessId } = useCurrentDataStore.getState();
  await deleteFactDefinitionApi(currentProjectId!, fact_id);
  queryClient.invalidateQueries({
    queryKey: ["estimationFactDefinitions", currentProjectId, currentProcessId],
  });
};

export const createEstimationProcessContextMenu = (
  onEdit: (estimationProcess: EstimationProcess) => void
): ContextMenuDefinition<EstimationProcess> => ({
  items: [
    {
      id: "edit-estimation-process",
      label: "Edit",
      onClick: (process) => onEdit(process),
    },
    {
      id: "delete-estimation-process",
      label: "Delete",
      danger: true,
      onClick: async (process) => {
        if (process.process_id) {
          await handleDeleteEstimationProcess(process.process_id);
        }
      },
    },
  ],
});

export const handleDeleteEstimationProcess = async (process_id: string) => {
  const { currentProjectId } = useCurrentDataStore.getState();
  await deleteEstimationProcessApi(currentProjectId!, process_id);
  queryClient.invalidateQueries({
    queryKey: ["estimationProcesses", currentProjectId],
    exact: false,
  });
};