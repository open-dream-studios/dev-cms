// project/src/modules/EstimationModule/_actions/estimations.actions.tsx
import { deleteFactDefinitionApi } from "@/api/estimations/estimationFactDefinitions.api";
import { queryClient } from "@/lib/queryClient";
import { useCurrentDataStore } from "@/store/currentDataStore";
import {
  ContextMenuDefinition,
  EstimationFactDefinition,
} from "@open-dream/shared";

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
