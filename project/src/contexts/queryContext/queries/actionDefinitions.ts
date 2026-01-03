// project/src/context/queryContext/queries/actionDefinitions.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ActionDefinition, ActionDefinitionInput } from "@open-dream/shared";
import {
  deleteActionDefinitionApi,
  fetchActionDefinitionsApi,
  upsertActionDefinitionApi,
} from "@/api/actionDefinitions.api";

export function useActionDefinitions(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const queryClient = useQueryClient();

  const {
    data: actionDefinitionsData,
    isLoading: isLoadingActionDefinitions,
    refetch: refetchActionDefinitions,
  } = useQuery<ActionDefinition[]>({
    queryKey: ["actionDefinitions", currentProjectId],
    queryFn: async () => fetchActionDefinitionsApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertActionDefinitionMutation = useMutation({
    mutationFn: async (actionDefinition: ActionDefinitionInput) =>
      upsertActionDefinitionApi(actionDefinition),
    onMutate: async (updatedActionDefinition: ActionDefinitionInput) => {
      const queryKey = ["actionDefinitions", currentProjectId];
      await queryClient.cancelQueries({ queryKey });

      const previousData =
        queryClient.getQueryData<ActionDefinition[]>(queryKey);
      if (!previousData) return { previousData, queryKey };

      const newData = (() => {
        const exists = previousData.some(
          (t) =>
            t.action_definition_id ===
            updatedActionDefinition.action_definition_id
        );
        if (exists) {
          return previousData.map((t) =>
            t.action_definition_id ===
            updatedActionDefinition.action_definition_id
              ? updatedActionDefinition
              : t
          );
        }
        return [...previousData, updatedActionDefinition];
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

  const deleteActionDefinitionMutation = useMutation({
    mutationFn: async (action_definition_id: string) =>
      deleteActionDefinitionApi(currentProjectId!, action_definition_id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["actionDefinitions", currentProjectId],
      });
    },
    onError: (error) => {
      console.error("❌ Delete actionDefinition failed:", error);
    },
  });

  const upsertActionDefinition = async (
    actionDefinition: ActionDefinitionInput
  ) => {
    return await upsertActionDefinitionMutation.mutateAsync(actionDefinition);
  };

  const deleteActionDefinition = async (action_definition_id: string) => {
    await deleteActionDefinitionMutation.mutateAsync(action_definition_id);
  };

  return {
    actionDefinitionsData,
    isLoadingActionDefinitions,
    refetchActionDefinitions,
    upsertActionDefinition,
    deleteActionDefinition,
  };
}
