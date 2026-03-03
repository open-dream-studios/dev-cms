// project/src/modules/_utils/Search/_store/search.store.tsx
import { createStore } from "@/store/createStore";
import { CustomerSearchContext, ProductSearchContext } from "@open-dream/shared";

export const useSearchUIStore = createStore({
  // CUSTOMER SEARCH
  currentCustomerSearchTerm: "",
  customerSearchContext: null as CustomerSearchContext,

  // PRODUCT SEARCH
  currentProductSearchTerm: "",
  productSearchContext: null as ProductSearchContext,
});
