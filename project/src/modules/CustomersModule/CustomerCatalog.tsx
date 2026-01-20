// project/src/modules/CustomersModule/CustomerCatalog.tsx
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { Customer, Screen } from "@open-dream/shared";
import React, { useEffect, useRef, useState } from "react";
import CustomerMiniCard from "../CustomersModule/CustomerMiniCard";
import { useUiStore } from "@/store/useUIStore";
import {
  triggerCustomerScrollRef,
  useCurrentDataStore,
} from "@/store/currentDataStore";
import {
  determineSearchContext,
  runSearchMatch,
  scrollToItem,
} from "@/util/functions/Search";
import CatalogMiniCardSkeleton from "@/lib/skeletons/CatalogMiniCardSkeleton";
import { useDataFilters } from "@/hooks/useDataFilters";
import { useCustomerUiStore } from "./_store/customers.store";

const CustomerCatalog = () => {
  const { customers, isLoadingCustomers } = useContextQueries();
  const { filteredCustomers: applyCustomerFilter, isCustomer } =
    useDataFilters();
  const { contactsFilter } = useCustomerUiStore();

  const {
    searchContext,
    setSearchContext,
    setCurrentCustomerSearchTerm,
    currentCustomerSearchTerm,
    currentCustomer,
  } = useCurrentDataStore();
  const { screen } = useUiStore();

  const itemRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const customerScrollRef = React.useRef<HTMLDivElement | null>(null);
  const ignoreNextSearchRef = useRef(false);
  const [pendingScroll, setPendingScroll] = useState(false);

  const baseCustomers = applyCustomerFilter(customers);

  useEffect(() => {
    setSearchContext(null);
    setCurrentCustomerSearchTerm("");
  }, [contactsFilter]);

  useEffect(() => {
    if (!triggerCustomerScrollRef.current) return;
    if (currentCustomer) {
      ignoreNextSearchRef.current = true;
      setSearchContext(null);
      setCurrentCustomerSearchTerm("");
      setPendingScroll(true);
    }
  }, [screen, currentCustomer]);

  useEffect(() => {
    if (!pendingScroll) return;
    if (!baseCustomers.length) return;
    if (!currentCustomer) return;

    const id = currentCustomer.customer_id;
    const el = itemRefs.current[id];
    const container = customerScrollRef.current;

    if (el && container) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ block: "start" });
        setPendingScroll(false);
      });
    }
  }, [pendingScroll, baseCustomers, currentCustomer]);

  useEffect(() => {
    if (ignoreNextSearchRef.current) {
      ignoreNextSearchRef.current = false;
      return;
    }

    if (!currentCustomerSearchTerm.trim()) {
      if (searchContext !== null) setSearchContext(null);
      return;
    }

    if (!baseCustomers.length) return;

    const ctx = determineSearchContext(
      currentCustomerSearchTerm.trim(),
      baseCustomers
    );
 
    if (
      searchContext &&
      JSON.stringify(searchContext.parsed) === JSON.stringify(ctx.parsed) &&
      searchContext.type === ctx.type
    ) {
      return;
    }

    if (ctx.bestMatch) {
      scrollToItem(ctx.bestMatch.customer_id, itemRefs, customerScrollRef, 106);
    }

    setSearchContext(ctx);
  }, [currentCustomerSearchTerm, baseCustomers]);

  const finalCustomers = React.useMemo(() => {
    if (!currentCustomerSearchTerm.trim() || !searchContext)
      return baseCustomers;

    const ctx = searchContext;
    return baseCustomers.filter((customer) => {
      const schema = ctx.schema(customer);
      const result = runSearchMatch(ctx.parsed, schema);
      return result.isMatch;
    });
  }, [baseCustomers, searchContext, currentCustomerSearchTerm]);

  return (
    <div
      ref={customerScrollRef}
      className="w-[100%] h-[100%] px-[15px] pb-[20px] flex flex-col overflow-y-auto gap-[9px]"
    >
      {isLoadingCustomers
        ? Array.from({ length: 4 }).map((_, i) => (
            <CatalogMiniCardSkeleton key={i} />
          ))
        : finalCustomers.map((customer: Customer, index: number) => (
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
