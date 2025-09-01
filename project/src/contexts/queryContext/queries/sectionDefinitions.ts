// src/context/queryContext/queries/sectionDefinitions.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { SectionDefinition, Section } from "@/types/pages";

export function useSectionDefinitions(isLoggedIn: boolean) {
  const queryClient = useQueryClient();

  const {
    data: sectionDefinitions = [],
    isLoading: isLoadingSectionDefinitions,
    refetch: refetchSectionDefinitions,
  } = useQuery<SectionDefinition[]>({
    queryKey: ["sectionDefinitions"],
    queryFn: async () => {
      const res = await makeRequest.post("/api/sections/section-definitions/get-all");
      return res.data.sectionDefinitions;
    },
    enabled: isLoggedIn,
  });

  const upsertSectionDefinitionMutation = useMutation({
    mutationFn: async (data: {
      id?: number;
      identifier: string;
      name: string;
      parent_section_definition_id?: number | null;
      allowed_elements?: string[];
      config_schema?: Record<string, any>;
    }) => {
      await makeRequest.post("/api/sections/section-definitions/upsert", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sectionDefinitions"] });
    },
  });

  const deleteSectionDefinitionMutation = useMutation({
    mutationFn: async (id: number) => {
      await makeRequest.post("/api/sections/section-definitions/delete", { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sectionDefinitions"] });
    },
  });

  return {
    sectionDefinitions,
    isLoadingSectionDefinitions,
    refetchSectionDefinitions,
    upsertSectionDefinition: (data: {
      id?: number;
      identifier: string;
      name: string;
      parent_section_definition_id?: number | null;
      allowed_elements?: string[];
      config_schema?: Record<string, any>;
    }) => upsertSectionDefinitionMutation.mutateAsync(data),
    deleteSectionDefinition: (id: number) =>
      deleteSectionDefinitionMutation.mutateAsync(id),
  };
}