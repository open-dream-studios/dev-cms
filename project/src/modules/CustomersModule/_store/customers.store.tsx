// project/src/modules/CustomersModule/_store/customers.store.tsx
import { createStore } from "@/store/createStore";
import { CustomersScreen } from "@open-dream/shared";

export type ContactFilter = "contacts" | "customers";
export const contactFilterOptions: ContactFilter[] = ["contacts", "customers"];

export const useCustomerUiStore = createStore({
  contactsFilter: "contacts" as ContactFilter,
  customersScreen: "bookings" as CustomersScreen
});
