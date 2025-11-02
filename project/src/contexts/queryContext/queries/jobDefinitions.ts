// src/context/queryContext/queries/jobDefinitions.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { JobDefinition } from "@shared/types/models/jobs";

export function useJobDefinitions(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();

  const {
    data: jobDefinitionsData,
    isLoading: isLoadingJobDefinitions,
    refetch: refetchJobDefinitions,
  } = useQuery<JobDefinition[]>({
    queryKey: ["jobDefinitions", currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return [];
      const res = await makeRequest.post("/api/jobs/get-definitions", {
        project_idx: currentProjectId,
      });
      return res.data.jobDefinitions || [];
    },
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertJobDefinitionMutation = useMutation({
    mutationFn: async (definition: JobDefinition) => {
      if (!currentProjectId) throw new Error("No project selected");
      const res = await makeRequest.post("/api/jobs/upsert-definition", {
        ...definition,
        project_idx: currentProjectId,
      });
      return res.data;
    },
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
    mutationFn: async (job_definition_id: string) => {
      if (!currentProjectId) throw new Error("No project selected");
      await makeRequest.post("/api/jobs/delete-definition", {
        job_definition_id,
        project_idx: currentProjectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["jobDefinitions", currentProjectId],
      });
    },
    onError: (error) => {
      console.error("❌ Delete job definition failed:", error);
    },
  });

  const upsertJobDefinition = async (definition: JobDefinition) => {
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
