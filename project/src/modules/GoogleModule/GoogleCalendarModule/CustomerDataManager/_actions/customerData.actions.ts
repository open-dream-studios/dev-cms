// project/src/modules/GoogleModule/GoogleCalendarModule/CustomerDataManager/_actions/customerData.actions.ts
import { deleteLeadApi } from "@/api/leads.api";
import { queryClient } from "@/lib/queryClient";
import { ContextMenuDefinition, Lead } from "@open-dream/shared";
import { useCustomerDataUIStore } from "../_store/customerData.store";
import { useCurrentDataStore } from "@/store/currentDataStore";

export const createLeadContextMenu = (): ContextMenuDefinition<Lead> => ({
  items: [
    {
      id: "delete-lead",
      label: "Delete Lead",
      danger: true,
      onClick: async (lead) => {
        await handleDeleteLead(lead.lead_id);
      },
    },
  ],
});

export const handleDeleteLead = async (lead_id: string | null) => {
  const { currentProjectId } = useCurrentDataStore.getState();
  const { setIsAddingLead, setEditingLead } = useCustomerDataUIStore.getState();
  if (!currentProjectId || !lead_id) return;
  await deleteLeadApi(currentProjectId, lead_id);
  queryClient.invalidateQueries({
    queryKey: ["leads", currentProjectId],
  });
  setIsAddingLead(false);
  setEditingLead(null);
};
