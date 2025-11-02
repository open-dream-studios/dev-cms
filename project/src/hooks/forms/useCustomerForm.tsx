// src/hooks/forms/useCustomerForm.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CustomerSchema,
  CustomerFormData,
  customerToForm,
} from "@/util/schemas/customerSchema";
import { Customer, CustomerInput } from "@open-dream/shared";
import { SubmitHandler } from "react-hook-form";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";

export function useCustomerForm(customer?: CustomerInput | null) {
  return useForm<CustomerFormData>({
    resolver: zodResolver(CustomerSchema),
    defaultValues: customerToForm(customer),
    mode: "onChange",
  });
}

export function useCustomerFormSubmit() {
  const { upsertCustomer } = useContextQueries();
  const { setAddingCustomer } = useUiStore();
  const { currentProjectId, currentCustomer, setCurrentCustomerData } =
    useCurrentDataStore();

  const onCustomerFormSubmit: SubmitHandler<CustomerFormData> = async (
    data
  ) => {
    if (!currentProjectId) return;

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
      const { id, customer_id } = await upsertCustomer(newCustomer);
      if (customer_id && id) {
        setCurrentCustomerData({
          ...newCustomer,
          id,
          customer_id,
        } as Customer);
        setAddingCustomer(false);
      }
    } catch (err) {
      console.error("❌ Customer upsert failed in form:", err);
    }
  };

  return { onCustomerFormSubmit };
}
