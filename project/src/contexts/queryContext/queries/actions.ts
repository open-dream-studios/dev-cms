// project/src/context/queryContext/queries/actions.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Action, ActionInput } from "@open-dream/shared";
import {
  deleteProjectActionApi,
  fetchProjectActionsApi,
  upsertProjectActionApi,
} from "@/api/actions.api";

export function useActions(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();

  const {
    data: actionsData,
    isLoading: isLoadingActions,
    refetch: refetchActions,
  } = useQuery<Action[]>({
    queryKey: ["actions", currentProjectId],
    queryFn: async () => fetchProjectActionsApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertActionMutation = useMutation({
    mutationFn: async (action: ActionInput) => upsertProjectActionApi(action),
    onMutate: async (updatedAction: ActionInput) => {
      const queryKey = ["actions", currentProjectId];
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<Action[]>(queryKey);
      if (!previousData) return { previousData, queryKey };

      const newData = (() => {
        const exists = previousData.some(
          (t) => t.action_id === updatedAction.action_id
        );
        if (exists) {
          return previousData.map((t) =>
            t.action_id === updatedAction.action_id ? updatedAction : t
          );
        }
        return [...previousData, updatedAction];
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

  const deleteActionMutation = useMutation({
    mutationFn: async (action_id: string) =>
      deleteProjectActionApi(currentProjectId!, action_id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["actions", currentProjectId],
      });
    },
    onError: (error) => {
      console.error("❌ Delete action failed:", error);
    },
  });

  const upsertAction = async (action: ActionInput) => {
    return await upsertActionMutation.mutateAsync(action);
  };

  const deleteAction = async (action_id: string) => {
    await deleteActionMutation.mutateAsync(action_id);
  };

  return {
    actionsData,
    isLoadingActions,
    refetchActions,
    upsertAction,
    deleteAction,
  };
}
