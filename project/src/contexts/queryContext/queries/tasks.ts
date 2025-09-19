// src/context/queryContext/queries/tasks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { Task } from "@/types/jobs";

export function useTasks(isLoggedIn: boolean, currentProjectId: number | null) {
  const queryClient = useQueryClient();

  const {
    data: tasksData,
    isLoading: isLoadingTasks,
    refetch: refetchTasks,
  } = useQuery<Task[]>({
    queryKey: ["tasks", currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return [];
      const res = await makeRequest.post("/api/tasks/get", {
        project_idx: currentProjectId,
      });
      return res.data.tasks || [];
    },
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      const res = await makeRequest.post("/api/tasks/upsert", {
        ...task,
        project_idx: currentProjectId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", currentProjectId] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (task_id: string) => {
      await makeRequest.post("/api/tasks/delete", {
        task_id,
        project_idx: currentProjectId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", currentProjectId] });
    },
  });

  const upsertTask = async (task: Task) => {
    return await upsertTaskMutation.mutateAsync(task);
  };

  const deleteTask = async (task_id: string) => {
    await deleteTaskMutation.mutateAsync(task_id);
  };

  return {
    tasksData,
    isLoadingTasks,
    refetchTasks,
    upsertTask,
    deleteTask,
  };
}

// export function useTaskDefinitions(
//   isLoggedIn: boolean,
//   currentProjectId: number | null
// ) {
//   const queryClient = useQueryClient();

//   const {
//     data: taskDefinitionsData,
//     isLoading: isLoadingTaskDefinitions,
//     refetch: refetchTaskDefinitions,
//   } = useQuery<TaskDefinition[]>({
//     queryKey: ["taskDefinitions", currentProjectId],
//     queryFn: async () => {
//       if (!currentProjectId) return [];
//       const res = await makeRequest.post("/api/tasks/get-definitions", {
//         project_idx: currentProjectId,
//       });
//       return res.data.taskDefinitions || [];
//     },
//     enabled: isLoggedIn && !!currentProjectId,
//   });

//   const upsertTaskDefinitionMutation = useMutation({
//     mutationFn: async (definition: TaskDefinition) => {
//       if (!currentProjectId) throw new Error("No project selected");
//       const res = await makeRequest.post("/api/tasks/upsert-definition", {
//         ...definition,
//         project_idx: currentProjectId,
//       });
//       return res.data;
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: ["taskDefinitions", currentProjectId],
//       });
//     },
//   });

//   const deleteTaskDefinitionMutation = useMutation({
//     mutationFn: async (task_definition_id: string) => {
//       if (!currentProjectId) throw new Error("No project selected");
//       await makeRequest.post("/api/tasks/delete-definition", {
//         task_definition_id,
//         project_idx: currentProjectId,
//       });
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({
//         queryKey: ["taskDefinitions", currentProjectId],
//       });
//     },
//   });

//   const upsertTaskDefinition = async (definition: TaskDefinition) => {
//     return await upsertTaskDefinitionMutation.mutateAsync(definition);
//   };

//   const deleteTaskDefinition = async (task_definition_id: string) => {
//     await deleteTaskDefinitionMutation.mutateAsync(task_definition_id);
//   };

//   return {
//     taskDefinitionsData,
//     isLoadingTaskDefinitions,
//     refetchTaskDefinitions,
//     upsertTaskDefinition,
//     deleteTaskDefinition,
//   };
// }