// project/src/modules/EstimationsModule/_helpers/estimations.helpers.ts
import { deleteEstimationProcessApi, EstimationProcess } from "@/api/estimations/process/estimationProcess.api";
import { queryClient } from "@/lib/queryClient";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { ContextMenuDefinition, FactType } from "@open-dream/shared";

export const factTypeConversion = (factType: FactType) => {
  let fact: any = factType;
  if (factType === "enum") fact = "Selection";
  if (factType === "boolean") fact = "True / False";
  if (factType === "string") fact = "Text";
  return fact;
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