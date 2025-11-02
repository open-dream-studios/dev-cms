// src/context/queryContext/queries/sectionDefinitions.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { makeRequest } from "@/util/axios";
import { SectionDefinition } from "@open-dream/shared";

export function useSectionDefinitions(isLoggedIn: boolean) {
  const queryClient = useQueryClient();

  const {
    data: sectionDefinitions = [],
    isLoading: isLoadingSectionDefinitions,
    refetch: refetchSectionDefinitions,
  } = useQuery<SectionDefinition[]>({
    queryKey: ["sectionDefinitions"],
    queryFn: async () => {
      const res = await makeRequest.post(
        "/api/sections/section-definitions/get-all"
      );
      return res.data.sectionDefinitions;
    },
    enabled: isLoggedIn,
  });

  const upsertSectionDefinitionMutation = useMutation({
    mutationFn: async (data: SectionDefinition) => {
      await makeRequest.post("/api/sections/section-definitions/upsert", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sectionDefinitions"] });
    },
  });

  const deleteSectionDefinitionMutation = useMutation({
    mutationFn: async (section_definition_id: string) => {
      await makeRequest.post("/api/sections/section-definitions/delete", {
        section_definition_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sectionDefinitions"] });
    },
  });

  return {
    sectionDefinitions,
    isLoadingSectionDefinitions,
    refetchSectionDefinitions,
    upsertSectionDefinition: (data: SectionDefinition) =>
      upsertSectionDefinitionMutation.mutateAsync(data),
    deleteSectionDefinition: (section_definition_id: string) =>
      deleteSectionDefinitionMutation.mutateAsync(section_definition_id),
  };
}
