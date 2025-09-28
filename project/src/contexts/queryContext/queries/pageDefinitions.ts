// src/context/queryContext/queries/pageDefinitions.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { PageDefinition } from "@/types/pages";

export function usePageDefinitions(isLoggedIn: boolean) {
  const queryClient = useQueryClient();
  const {
    data: pageDefinitions = [],
    isLoading: isLoadingPageDefinitions,
    refetch: refetchPageDefinitions,
  } = useQuery<PageDefinition[]>({
    queryKey: ["pageDefinitions"],
    queryFn: async () => {
      const res = await makeRequest.post("/api/pages/page-definitions/get-all");
      return res.data.pageDefinitions;
    },
    enabled: isLoggedIn,
  });

  const upsertPageDefinitionMutation = useMutation({
    mutationFn: async (data: PageDefinition) => {
      await makeRequest.post("/api/pages/page-definitions/upsert", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pageDefinitions"] });
    },
  });

  const deletePageDefinitionMutation = useMutation({
    mutationFn: async (page_definition_id: string) => {
      await makeRequest.post("/api/pages/page-definitions/delete", {
        page_definition_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pageDefinitions"] });
    },
  });

  return {
    pageDefinitions,
    isLoadingPageDefinitions,
    refetchPageDefinitions,
    upsertPageDefinition: (data: PageDefinition) =>
      upsertPageDefinitionMutation.mutateAsync(data),
    deletePageDefinition: (page_definition_id: string) =>
      deletePageDefinitionMutation.mutateAsync(page_definition_id),
  };
}
