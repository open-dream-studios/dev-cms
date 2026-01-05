// project/src/context/queryContext/queries/jobDefinitions.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { JobDefinition, JobDefinitionInput } from "@open-dream/shared";
import {
  deleteJobDefinitionApi,
  fetchJobDefinitionsApi,
  upsertJobDefinitionApi,
} from "@/api/jobDefinitions.api";
import { useRouteScope } from "@/contexts/routeScopeContext";

export function useJobDefinitions(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();
  const routeScope = useRouteScope();
  const isPublic = routeScope === "public";

  const {
    data: jobDefinitionsData,
    isLoading: isLoadingJobDefinitions,
    refetch: refetchJobDefinitions,
  } = useQuery<JobDefinition[]>({
    queryKey: ["jobDefinitions", currentProjectId],
    queryFn: async () => fetchJobDefinitionsApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId && !isPublic
  });

  const upsertJobDefinitionMutation = useMutation({
    mutationFn: async (definition: JobDefinitionInput) =>
      upsertJobDefinitionApi(definition),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["jobDefinitions", currentProjectId],
      });
    },
    onError: (error) => {
      console.error("❌ Upsert job definition failed:", error);
    },
  });

  const deleteJobDefinitionMutation = useMutation({
    mutationFn: async (job_definition_id: string) =>
      deleteJobDefinitionApi(currentProjectId!, job_definition_id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["jobDefinitions", currentProjectId],
      });
    },
    onError: (error) => {
      console.error("❌ Delete job definition failed:", error);
    },
  });

  const upsertJobDefinition = async (definition: JobDefinitionInput) => {
    return await upsertJobDefinitionMutation.mutateAsync(definition);
  };

  const deleteJobDefinition = async (job_definition_id: string) => {
    await deleteJobDefinitionMutation.mutateAsync(job_definition_id);
  };

  return {
    jobDefinitionsData,
    isLoadingJobDefinitions,
    refetchJobDefinitions,
    upsertJobDefinition,
    deleteJobDefinition,
  };
}
