// project/src/context/queryContext/queries/pageDefinitions.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageDefinition, PageDefinitionInput } from "@open-dream/shared";
import {
  deleteProjectPageDefinitionApi,
  fetchProjectPageDefinitionsApi,
  upsertProjectPageDefinitionApi,
} from "@/api/pageDefinitions.api";
import { useRouteScope } from "@/contexts/routeScopeContext";

export function usePageDefinitions(isLoggedIn: boolean) {
  const queryClient = useQueryClient();
  const routeScope = useRouteScope();
  const isPublic = routeScope === "public";

  const {
    data: pageDefinitions = [],
    isLoading: isLoadingPageDefinitions,
    refetch: refetchPageDefinitions,
  } = useQuery<PageDefinition[]>({
    queryKey: ["pageDefinitions"],
    queryFn: async () => fetchProjectPageDefinitionsApi(),
    enabled: isLoggedIn && !isPublic
  });

  const upsertPageDefinitionMutation = useMutation({
    mutationFn: async (definition: PageDefinitionInput) =>
      upsertProjectPageDefinitionApi(definition),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pageDefinitions"] });
    },
  });

  const deletePageDefinitionMutation = useMutation({
    mutationFn: async (page_definition_id: string) =>
      deleteProjectPageDefinitionApi(page_definition_id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pageDefinitions"] });
    },
  });

  return {
    pageDefinitions,
    isLoadingPageDefinitions,
    refetchPageDefinitions,
    upsertPageDefinition: (data: PageDefinitionInput) =>
      upsertPageDefinitionMutation.mutateAsync(data),
    deletePageDefinition: (page_definition_id: string) =>
      deletePageDefinitionMutation.mutateAsync(page_definition_id),
  };
}
