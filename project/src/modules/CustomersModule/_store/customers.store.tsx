// project/src/modules/CustomersModule/_store/customers.store.tsx
import { createStore } from "@/store/createStore";

export type ContactFilter = "contacts" | "customers";
export const contactFilterOptions: ContactFilter[] = ["contacts", "customers"];

export const useCustomerUiStore = createStore({
  contactsFilter: "contacts" as ContactFilter,
});
