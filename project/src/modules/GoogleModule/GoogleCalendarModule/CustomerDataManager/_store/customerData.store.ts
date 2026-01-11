// project/src/modules/GoogleModule/GoogleCalendarModule/CustomerDataManager/_store/customerData.store.ts
import { createStore } from "@/store/createStore";
import { Lead, LeadInput } from "@open-dream/shared";

export const emptyLeadInput: LeadInput = {
  lead_id: null,
  project_idx: 0,
  customer_id: "",
  lead_type: "product",
  product_id: null,
  job_definition_id: null,
  status: "new",
  notes: null,
  source: null,
};

type CustomerDataTab = "schedule" | "leads";

export const useCustomerDataUIStore = createStore({
  editingLead: null as Lead | null,
  isAddingLead: false,
  activeTab: "schedule" as CustomerDataTab,
});

export const updateEditingLead = (patch: Partial<Lead>) => {
  const { editingLead, setEditingLead } = useCustomerDataUIStore.getState();
  setEditingLead(editingLead ? { ...editingLead, ...patch } : editingLead);
};
