// src/context/queryContext/queries/sectionDefinitions.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SectionDefinition } from "@open-dream/shared";
import {
  deleteProjectSectionDefinitionsApi,
  fetchProjectSectionDefinitionsApi,
  upsertProjectSectionDefinitionsApi,
} from "@/api/sectionDefinitions.api";

export function useSectionDefinitions(isLoggedIn: boolean) {
  const queryClient = useQueryClient();

  const {
    data: sectionDefinitions = [],
    isLoading: isLoadingSectionDefinitions,
    refetch: refetchSectionDefinitions,
  } = useQuery<SectionDefinition[]>({
    queryKey: ["sectionDefinitions"],
    queryFn: async () => fetchProjectSectionDefinitionsApi(),
    enabled: isLoggedIn,
  });

  const upsertSectionDefinitionMutation = useMutation({
    mutationFn: async (data: SectionDefinition) =>
      upsertProjectSectionDefinitionsApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sectionDefinitions"] });
    },
  });

  const deleteSectionDefinitionMutation = useMutation({
    mutationFn: async (section_definition_id: string) =>
      deleteProjectSectionDefinitionsApi(section_definition_id),
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
