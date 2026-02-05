// project/src/context/queryContext/queries/estimations/estimationProcess.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchEstimationProcessesApi,
  upsertEstimationProcessApi,
  deleteEstimationProcessApi,
  EstimationProcess,
} from "@/api/estimations/process/estimationProcess.api";

export function useEstimationProcesses(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  const qc = useQueryClient();

  const { data: processes = [], isLoading } = useQuery({
    queryKey: ["estimationProcesses", currentProjectId],
    queryFn: () => fetchEstimationProcessesApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId,
  });

  const upsertMutation = useMutation({
    mutationFn: (payload: {
      process_id: string | null;
      label?: string | null;
      folder_id: number | null
    }) => upsertEstimationProcessApi(currentProjectId!, payload),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["estimationProcesses", currentProjectId],
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (process_id: string) =>
      deleteEstimationProcessApi(currentProjectId!, process_id),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["estimationProcesses", currentProjectId],
      }),
  });

  return {
    estimationProcesses: processes as EstimationProcess[],
    isLoadingEstimationProcesses: isLoading,
    upsertEstimationProcess: (p: {
      process_id: string | null;
      label?: string | null;
      folder_id: number | null
    }) => upsertMutation.mutateAsync(p),
    deleteEstimationProcess: (process_id: string) =>
      deleteMutation.mutateAsync(process_id),
  };
}