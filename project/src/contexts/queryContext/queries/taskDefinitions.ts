// src/context/queryContext/queries/taskDefinitions.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { TaskDefinition } from "@/types/jobs";

export function useTaskDefinitions(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();

  const {
    data: taskDefinitionsData,
    isLoading: isLoadingTaskDefinitions,
    refetch: refetchTaskDefinitions,
  } = useQuery<TaskDefinition[]>({
    queryKey: ["taskDefinitions", currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return [];
      const res = await makeRequest.post("/api/tasks/get-definitions", {
        project_idx: currentProjectId,
      });
      return res.data.taskDefinitions || [];
    },
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertTaskDefinitionMutation = useMutation({
    mutationFn: async (definition: TaskDefinition) => {
      if (!currentProjectId) throw new Error("No project selected");
      const res = await makeRequest.post("/api/tasks/upsert-definition", {
        ...definition,
        project_idx: currentProjectId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["taskDefinitions", currentProjectId],
      });
    },
  });

  const deleteTaskDefinitionMutation = useMutation({
    mutationFn: async (task_definition_id: string) => {
      if (!currentProjectId) throw new Error("No project selected");
      await makeRequest.post("/api/tasks/delete-definition", {
        task_definition_id,
        project_idx: currentProjectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["taskDefinitions", currentProjectId],
      });
    },
  });

  const upsertTaskDefinition = async (definition: TaskDefinition) => {
    return await upsertTaskDefinitionMutation.mutateAsync(definition);
  };

  const deleteTaskDefinition = async (task_definition_id: string) => {
    await deleteTaskDefinitionMutation.mutateAsync(task_definition_id);
  };

  return {
    taskDefinitionsData,
    isLoadingTaskDefinitions,
    refetchTaskDefinitions,
    upsertTaskDefinition,
    deleteTaskDefinition,
  };
}
