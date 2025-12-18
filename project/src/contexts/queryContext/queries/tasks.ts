// src/context/queryContext/queries/tasks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Task } from "@open-dream/shared";
import {
  deleteProjectTaskApi,
  fetchProjectTasksApi,
  upsertProjectTaskApi,
} from "@/api/tasks.api";

export function useTasks(isLoggedIn: boolean, currentProjectId: number | null) {
  const queryClient = useQueryClient();

  const {
    data: tasksData,
    isLoading: isLoadingTasks,
    refetch: refetchTasks,
  } = useQuery<Task[]>({
    queryKey: ["tasks", currentProjectId],
    queryFn: async () => fetchProjectTasksApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertTaskMutation = useMutation({
    mutationFn: async (task: Task) =>
      upsertProjectTaskApi(currentProjectId!, task),
    onMutate: async (updatedTask: Task) => {
      const queryKey = ["tasks", currentProjectId];
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<Task[]>(queryKey);
      if (!previousData) return { previousData, queryKey };

      const newData = (() => {
        const exists = previousData.some(
          (t) => t.task_id === updatedTask.task_id
        );
        if (exists) {
          return previousData.map((t) =>
            t.task_id === updatedTask.task_id ? updatedTask : t
          );
        }
        return [...previousData, updatedTask];
      })();

      queryClient.setQueryData(queryKey, newData);

      return { previousData, queryKey };
    },

    onError: (_err, _newData, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
    },

    onSettled: (_data, _err, _variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (task_id: string) =>
      deleteProjectTaskApi(currentProjectId!, task_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", currentProjectId] });
    },
    onError: (error) => {
      console.error("❌ Delete task failed:", error);
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
