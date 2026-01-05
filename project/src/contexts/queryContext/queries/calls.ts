// project/src/context/queryContext/queries/calls.ts
import { useQuery } from "@tanstack/react-query";
import { fetchProjectCallsApi } from "@/api/calls.api";
import { useRouteScope } from "@/contexts/routeScopeContext";

export function useProjectCalls(
  isLoggedIn: boolean,
  currentProjectId: number | null
) {
  // const queryClient = useQueryClient();
  const routeScope = useRouteScope();
  const isPublic = routeScope === "public";

  const {
    data: projectCalls = [],
    isLoading: isLoadingProjectCalls,
    refetch: refetchProjectCalls,
  } = useQuery({
    queryKey: ["projectCalls", currentProjectId],
    queryFn: async () => fetchProjectCallsApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId && !isPublic
  });

  // const upsertProjectCallMutation = useMutation({
  //   mutationFn: async (data: ProjectCall) => {
  //     const res = await makeRequest.post("/projectCalls/upsert", {
  //       ...data,
  //       project_idx: currentProjectId,
  //     });
  //     return {
  //       id: res.data.id,
  //       projectCall_id: res.data.projectCall_id,
  //     };
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({
  //       queryKey: ["projectCalls", currentProjectId],
  //     });
  //   },
  //   onError: (error) => {
  //     console.error("❌ Upsert projectCall failed:", error);
  //   },
  // });

  // const deleteProjectCallMutation = useMutation({
  //   mutationFn: async (projectCall_id: string) => {
  //     await makeRequest.post("/projectCalls/delete", {
  //       projectCall_id,
  //       project_idx: currentProjectId,
  //     });
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({
  //       queryKey: ["projectCalls", currentProjectId],
  //     });
  //   },
  // });

  // const upsertProjectCall = async (data: ProjectCall) => {
  //   return await upsertProjectCallMutation.mutateAsync(data);
  // };

  // const deleteProjectCall = async (projectCall_id: string) => {
  //   await deleteProjectCallMutation.mutateAsync(projectCall_id);
  // };

  return {
    projectCalls,
    isLoadingProjectCalls,
    refetchProjectCalls,
    // upsertProjectCall,
    // deleteProjectCall,
  };
}
