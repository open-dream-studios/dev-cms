// project/src/modules/CustomerProducts/_actions/customerProducts.actions.ts
import { deleteJobDefinitionApi } from "@/api/jobDefinitions.api";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { ContextMenuDefinition, JobDefinition } from "@open-dream/shared";
import { QueryClient } from "@tanstack/react-query";
export const createJobDefinitionContextMenu = (
  queryClient: QueryClient
): ContextMenuDefinition<JobDefinition> => ({
  items: [
    {
      id: "delete-job-definition",
      label: "Delete Definition",
      danger: true,
      onClick: async (definition) => {
        await handleDeleteJobDefinition(
          queryClient,
          definition.job_definition_id
        );
      },
    },
  ],
});

export const handleDeleteJobDefinition = async (
  queryClient: QueryClient,
  job_definition_id: string | null
) => {
  const { currentProjectId } = useCurrentDataStore.getState();
  if (!currentProjectId || !job_definition_id) return;
  await deleteJobDefinitionApi(currentProjectId, job_definition_id);

  queryClient.invalidateQueries({
    queryKey: ["jobDefinitions", currentProjectId],
  });
};
