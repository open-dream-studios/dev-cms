// project/src/hooks/useCustomers.tsx
import { Customer } from "@open-dream/shared";
import { setCurrentCustomerData, useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useFormInstanceStore } from "@/store/util/formInstanceStore";
import { customerToForm } from "@/util/schemas/customerSchema";
import { useCustomerFormSubmit } from "@/hooks/forms/useCustomerForm";

export function useCustomers() {
  const { deleteCustomer, refetchProductsData } = useContextQueries(); 
  const { setAddingCustomer } = useUiStore();

  const { getForm } = useFormInstanceStore();
  const customerForm = getForm("customer");
  const { onCustomerFormSubmit } = useCustomerFormSubmit();

  const handleCustomerClick = async (customer: Customer | null) => {
    if (customerForm?.formState.isDirty) {
      await customerForm.handleSubmit(onCustomerFormSubmit)();
    }
    setCurrentCustomerData(customer);
    setAddingCustomer(!customer);
    if (!customer && customerForm) {
      customerForm.reset(customerToForm(null));
    }
  };

  const handleDeleteCustomer = async (customer: Customer | null) => {
    if (!customer || !customer.customer_id) return;
    await deleteCustomer(customer.customer_id);
    if (customerForm) customerForm.reset(customerToForm(null));
    setCurrentCustomerData(null);
    setAddingCustomer(true);
    refetchProductsData();
  };

  return {
    handleCustomerClick,
    handleDeleteCustomer,
    customerForm,
  };
}
