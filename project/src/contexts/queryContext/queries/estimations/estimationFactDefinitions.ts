// project/src/context/queryContext/queries/estimations/estimationFactDefinitions.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteFactDefinitionApi,
  fetchFactDefinitionsApi,
  upsertFactDefinitionApi,
} from "@/api/estimations/estimationFactDefinitions.api";
import type { FactType } from "@open-dream/shared";

export function useEstimationFactDefinitions(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const qc = useQueryClient();

  const { data: factDefinitions = [], isLoading } = useQuery({
    queryKey: ["estimationFactDefinitions", currentProjectId],
    queryFn: () => fetchFactDefinitionsApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertMutation = useMutation({
    mutationFn: (payload: {
      fact_id?: string | null;
      fact_key: string;
      fact_type: FactType;
      description?: string | null;
    }) => upsertFactDefinitionApi(currentProjectId!, payload),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["estimationFactDefinitions", currentProjectId],
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (fact_id: string) =>
      deleteFactDefinitionApi(currentProjectId!, fact_id),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["estimationFactDefinitions", currentProjectId],
      }),
  });

  return {
    factDefinitions,
    isLoadingFactDefinitions: isLoading,
    upsertFactDefinition: (p: {
      fact_id?: string | null;
      fact_key: string;
      fact_type: FactType;
      description?: string | null;
    }) => upsertMutation.mutateAsync(p),
    deleteFactDefinition: (fact_id: string) =>
      deleteMutation.mutateAsync(fact_id),
  };
}
