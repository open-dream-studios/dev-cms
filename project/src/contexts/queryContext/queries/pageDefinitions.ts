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
      const res = await makeRequest.post("/api/page-definitions/get-all");
      return res.data.pageDefinitions;
    },
    enabled: isLoggedIn,
  });

  const upsertPageDefinitionMutation = useMutation({
    mutationFn: async (data: {
      id?: number;
      identifier: string;
      name: string;
      parent_page_definition_id?: number | null;
      allowed_sections?: string[];
      config_schema?: Record<string, any>;
    }) => {
      await makeRequest.post("/api/page-definitions/upsert", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pageDefinitions"] });
    },
  });

  const deletePageDefinitionMutation = useMutation({
    mutationFn: async (id: number) => {
      await makeRequest.post("/api/page-definitions/delete", { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pageDefinitions"] });
    },
  });

  return {
    pageDefinitions,
    isLoadingPageDefinitions,
    refetchPageDefinitions,
    upsertPageDefinition: (data: {
      id?: number;
      identifier: string;
      name: string;
      allowed_sections?: string[];
      config_schema?: Record<string, any>;
    }) => upsertPageDefinitionMutation.mutateAsync(data),
    deletePageDefinition: (id: number) =>
      deletePageDefinitionMutation.mutateAsync(id),
  };
}
