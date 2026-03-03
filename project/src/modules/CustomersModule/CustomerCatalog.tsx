// project/src/modules/CustomersModule/CustomerCatalog.tsx
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { Customer } from "@open-dream/shared";
import React from "react";
import CustomerMiniCard from "../CustomersModule/CustomerMiniCard";
import CatalogMiniCardSkeleton from "@/lib/skeletons/CatalogMiniCardSkeleton";
import { useDataFilters } from "@/hooks/useDataFilters";
import { useSearchUIStore } from "../_util/Search/_store/search.store";
import { useSearchableScrollList } from "../_util/Search/_hooks/search.hooks";
import { determineSearchContext } from "../_util/Search/_helpers/customerSearch.helpers";
import { useCurrentDataStore } from "@/store/currentDataStore";

const CustomerCatalog = () => {
  const { customers, isLoadingCustomers } = useContextQueries();
  const { currentCustomer } = useCurrentDataStore()
  const { filteredCustomers: applyCustomerFilter, isCustomer } =
    useDataFilters();
  const {
    currentCustomerSearchTerm,
    customerSearchContext,
    setCustomerSearchContext,
  } = useSearchUIStore();

  const baseCustomers = applyCustomerFilter(customers);
  const { containerRef, itemRefs, filteredItems } =
    useSearchableScrollList<Customer>({
      items: baseCustomers,
      searchTerm: currentCustomerSearchTerm,
      searchContext: customerSearchContext,
      setSearchContext: setCustomerSearchContext,
      determineContext: determineSearchContext,
      selectedItem: currentCustomer,
      getItemId: (c) => c.customer_id,
      externalTrigger: screen,
    });

  return (
    <div
      ref={containerRef}
      className="w-[100%] h-[100%] px-[15px] pb-[20px] flex flex-col overflow-y-auto gap-[9px]"
    >
      {isLoadingCustomers
        ? Array.from({ length: 4 }).map((_, i) => (
            <CatalogMiniCardSkeleton key={i} />
          ))
        : filteredItems.map((customer: Customer, index: number) => (
            <div
              key={customer.customer_id}
              ref={(el) => {
                itemRefs.current[customer.customer_id] = el;
              }}
            >
              <CustomerMiniCard
                customer={customer}
                index={index}
                isCustomer={isCustomer(customer)}
              />
            </div>
          ))}
    </div>
  );
};

export default CustomerCatalog;
