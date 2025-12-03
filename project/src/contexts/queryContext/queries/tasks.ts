// src/context/queryContext/queries/tasks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { Task } from "@open-dream/shared";
import { utcToProjectTimezone } from "@/util/functions/Time";

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
      const res = await makeRequest.post("/api/tasks", {
        project_idx: currentProjectId,
      });

      const tasks: Task[] = (res.data.tasks || []).map((task: Task) => ({
        ...task,
        scheduled_start_date: task.scheduled_start_date
          ? new Date(utcToProjectTimezone(task.scheduled_start_date as string)!)
          : null,
      }));

      return tasks;
    },
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertTaskMutation = useMutation({
    mutationFn: async (task: Task) => {
      const res = await makeRequest.post("/api/tasks/upsert", {
        ...task,
        project_idx: currentProjectId,
      });
      return res.data.task; // make sure backend returns full task
    },

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
    mutationFn: async (task_id: string) => {
      await makeRequest.post("/api/tasks/delete", {
        task_id,
        project_idx: currentProjectId,
      });
    },
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
