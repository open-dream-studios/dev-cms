// project/src/context/queryContext/queries/leads.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LeadInput } from "@open-dream/shared";
import { fetchLeadsApi, upsertLeadApi, deleteLeadApi } from "@/api/leads.api";
import { useRouteScope } from "@/contexts/routeScopeContext";

export function useLeads(isLoggedIn: boolean, currentProjectId: number | null) {
  const queryClient = useQueryClient();
  const routeScope = useRouteScope();
  const isPublic = routeScope === "public";

  const {
    data: leads = [],
    isLoading: isLoadingLeads,
    refetch: refetchLeads,
  } = useQuery({
    queryKey: ["leads", currentProjectId],
    queryFn: async () => fetchLeadsApi(currentProjectId!),
    enabled: isLoggedIn && !!currentProjectId && !isPublic
  });

  const upsertLeadMutation = useMutation({
    mutationFn: async (lead: LeadInput) =>
      upsertLeadApi(currentProjectId!, lead),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["leads", currentProjectId],
      });
    },
    onError: (error) => {
      console.error("❌ Upsert lead failed:", error);
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (lead_id: string) =>
      deleteLeadApi(currentProjectId!, lead_id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["leads", currentProjectId],
      });
    },
  });

  const upsertLead = async (lead: LeadInput) => {
    await upsertLeadMutation.mutateAsync(lead);
  };

  const deleteLead = async (lead_id: string) => {
    await deleteLeadMutation.mutateAsync(lead_id);
  };

  return {
    leads,
    isLoadingLeads,
    refetchLeads,
    upsertLead,
    deleteLead,
  };
}
