// project/src/modules/CustomersModule/_actions/customers.actions.ts
import {
  setCurrentCustomerData,
  useCurrentDataStore,
} from "@/store/currentDataStore";
import {
  ContextMenuDefinition,
  Customer,
  CustomerInput,
} from "@open-dream/shared";
import { QueryClient } from "@tanstack/react-query";
import { deleteCustomerApi, upsertCustomerApi } from "@/api/customers.api";
import { useUiStore } from "@/store/useUIStore";
import {
  CustomerFormData,
  customerToForm,
} from "@/util/schemas/customerSchema";
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

export const handleCustomerClick = async (
  queryClient: QueryClient,
  customer: Customer | null
) => {
  const { getForm } = useFormInstanceStore.getState();
  const { setAddingCustomer } = useUiStore.getState();
  const customerForm = getForm("customer");
  if (customerForm?.formState.isDirty) {
    await customerForm.handleSubmit((data) =>
      onCustomerFormSubmit(queryClient, data)
    )();
  }
  setCurrentCustomerData(customer);
  setAddingCustomer(!customer);
  if (!customer && customerForm) {
    customerForm.reset(customerToForm(null));
  }
};

export async function onCustomerFormSubmit(
  queryClient: QueryClient,
  data: CustomerFormData
): Promise<void> {
  const { currentProjectId, currentCustomer } = useCurrentDataStore.getState();
  if (!currentProjectId) return;
  const { setAddingCustomer } = useUiStore.getState();
  const newCustomer: CustomerInput = {
    project_idx: currentProjectId,
    customer_id: currentCustomer?.customer_id ?? null,
    first_name: data.first_name,
    last_name: data.last_name,
    phone: data.phone?.replace(/\D/g, "") ?? null,
    email: data.email ?? null,
    address_line1: data.address_line1 ?? null,
    address_line2: data.address_line2 ?? null,
    city: data.city ?? null,
    state: data.state ?? null,
    zip: data.zip ?? null,
    notes: data.notes ?? null,
  };

  try {
    const res = await upsertCustomerApi(currentProjectId, newCustomer);
    queryClient.invalidateQueries({
      queryKey: ["customers", currentProjectId],
    });
    if (!res) return;
    const { id, customer_id } = res;
    if (customer_id && id) {
      setCurrentCustomerData({
        ...newCustomer,
        id,
        customer_id,
      } as Customer);
      setAddingCustomer(false);
    }
  } catch (err) {
    console.error("❌ Customer upsert failed:", err);
  }
}
