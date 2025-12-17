
// project/src/modules/CustomersModule/_actions/customers.actions.ts
import {
  setCurrentCustomerData,
  useCurrentDataStore,
} from "@/store/currentDataStore";
import { ContextMenuDefinition, Customer } from "@open-dream/shared";
import { QueryClient } from "@tanstack/react-query";
import { deleteCustomerApi } from "@/api/customers.api";
import { useUiStore } from "@/store/useUIStore";
import { customerToForm } from "@/util/schemas/customerSchema";
import { useFormInstanceStore } from "@/store/util/formInstanceStore";

export const createCustomerContextMenu = (
  queryClient: QueryClient
): ContextMenuDefinition<Customer> => ({
  items: [
    {
      id: "delete-customer",
      label: "Delete Customer",
      danger: true,
      onClick: async (customer) => {
        await handleDeleteCustomer(queryClient, customer.customer_id);
      },
    },
  ],
});

export const handleDeleteCustomer = async (
  queryClient: QueryClient,
  customer_id: string | null
) => {
  const { currentProjectId } = useCurrentDataStore.getState();
  const { setAddingCustomer } = useUiStore.getState();
  if (!currentProjectId || !customer_id) return;
  await deleteCustomerApi(currentProjectId, customer_id);

  const { getForm } = useFormInstanceStore.getState();
  const customerForm = getForm("customer");
  if (customerForm) {
    customerForm.reset(customerToForm(null));
  }
  queryClient.invalidateQueries({
    queryKey: ["customers", currentProjectId],
  });
  setCurrentCustomerData(null);
  setAddingCustomer(true);
};
