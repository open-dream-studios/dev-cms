// project/src/context/queryContext/queries/sectionDefinitions.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SectionDefinition, SectionDefinitionInput } from "@open-dream/shared";
import {
  deleteProjectSectionDefinitionsApi,
  fetchProjectSectionDefinitionsApi,
  upsertProjectSectionDefinitionsApi,
} from "@/api/sectionDefinitions.api";
import { useRouteScope } from "@/contexts/routeScopeContext";

export function useSectionDefinitions(isLoggedIn: boolean) {
  const queryClient = useQueryClient();
  const routeScope = useRouteScope();
  const isPublic = routeScope === "public";

  const {
    data: sectionDefinitions = [],
    isLoading: isLoadingSectionDefinitions,
    refetch: refetchSectionDefinitions,
  } = useQuery<SectionDefinition[]>({
    queryKey: ["sectionDefinitions"],
    queryFn: async () => fetchProjectSectionDefinitionsApi(),
    enabled: isLoggedIn && !isPublic
  });

  const upsertSectionDefinitionMutation = useMutation({
    mutationFn: async (data: SectionDefinitionInput) =>
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
    upsertSectionDefinition: (data: SectionDefinitionInput) =>
      upsertSectionDefinitionMutation.mutateAsync(data),
    deleteSectionDefinition: (section_definition_id: string) =>
      deleteSectionDefinitionMutation.mutateAsync(section_definition_id),
  };
}
