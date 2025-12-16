// project/src/modules/components/ModuleLeftBar.tsx
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { Customer, Employee, Screen } from "@open-dream/shared";
import React, { useEffect, useRef, useState } from "react";
import CustomerMiniCard from "../CustomersModule/CustomerMiniCard";
import { customerToForm } from "@/util/schemas/customerSchema";
import { useUiStore } from "@/store/useUIStore";
import { useFormInstanceStore } from "@/store/util/formInstanceStore";
import { useCustomerFormSubmit } from "@/hooks/forms/useCustomerForm";
import { setCurrentCustomerData, useCurrentDataStore } from "@/store/currentDataStore";
import {
  determineSearchContext,
  runSearchMatch,
  scrollToItem,
} from "@/util/functions/Search";
import CatalogMiniCardSkeleton from "@/lib/skeletons/CatalogMiniCardSkeleton";
import { useContextMenu } from "@/hooks/useContextMenu";

const CustomerLeftBar = () => {
  const { customers, isLoadingCustomers } = useContextQueries();
  const {
    searchContext,
    setSearchContext,
    setCurrentCustomerSearchTerm,
    currentCustomerSearchTerm,
    currentCustomer, 
  } = useCurrentDataStore();
  const { getForm } = useFormInstanceStore();
  const { screen, setAddingCustomer } = useUiStore();
  const { openContextMenu } = useContextMenu<Customer | Employee>();

  const customerForm = getForm("customer");
  const { onCustomerFormSubmit } = useCustomerFormSubmit();

  const itemRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const customerScrollRef = React.useRef<HTMLDivElement | null>(null);
  const [ignoreNextSearch, setIgnoreNextSearch] = useState(false);
  const [pendingScroll, setPendingScroll] = useState(false);

  const lastScreenRef = useRef<Screen | null>(null);
  useEffect(() => {
    const last = lastScreenRef.current;
    const isRealNavigationIntoCustomers =
      last !== "customers" && screen === "customers";
    if (isRealNavigationIntoCustomers && currentCustomer) {
      setIgnoreNextSearch(true);
      setSearchContext(null);
      setCurrentCustomerSearchTerm("");
      setPendingScroll(true);
    }
    lastScreenRef.current = screen;
  }, [screen, currentCustomer]);

  useEffect(() => {
    if (!pendingScroll) return;
    if (!customers.length) return;
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
  }, [pendingScroll, customers, currentCustomer]);

  useEffect(() => {
    if (ignoreNextSearch) {
      setIgnoreNextSearch(false);
      return;
    }
    if (!currentCustomerSearchTerm.trim()) {
      setSearchContext(null);
      return;
    }
    if (!customers.length) return;
    const ctx = determineSearchContext(
      currentCustomerSearchTerm.trim(),
      customers
    );
    if (ctx.bestMatch) {
      scrollToItem(ctx.bestMatch.customer_id, itemRefs, customerScrollRef, 106);
    }

    setSearchContext(ctx);
  }, [
    currentCustomerSearchTerm,
    customers,
    setSearchContext,
    ignoreNextSearch,
  ]);

  const handleCustomerClick = async (customer: Customer | null) => {
    if (customerForm && customerForm.formState.isDirty) {
      await customerForm.handleSubmit(onCustomerFormSubmit)();
    }
    setCurrentCustomerData(customer);
    setAddingCustomer(!customer);
    if (customerForm && !customer) {
      customerForm.reset(customerToForm(null));
    }
  };

  const filteredCustomers = React.useMemo(() => {
    if (!currentCustomerSearchTerm.trim() || !searchContext) return customers;
    const ctx = searchContext;
    const parsed = ctx.parsed;
    return customers.filter((customer) => {
      const schema = ctx.schema(customer);
      const result = runSearchMatch(parsed, schema);
      return result.isMatch;
    });
  }, [customers, searchContext, currentCustomerSearchTerm]);

  return (
    <div
      ref={customerScrollRef}
      className="w-[100%] h-[100%] px-[15px] pb-[20px] flex flex-col overflow-y-auto gap-[9px]"
    >
      {isLoadingCustomers
        ? Array.from({ length: 4 }, (_, index) => {
            return <CatalogMiniCardSkeleton key={index} />;
          })
        : filteredCustomers.map((customer: Customer, index: number) => {
            return (
              <div
                key={customer.customer_id}
                ref={(el) => {
                  itemRefs.current[customer.customer_id] = el;
                }}
              >
                <CustomerMiniCard
                  customer={customer}
                  index={index}
                  handleContextMenu={(e) => openContextMenu(e, customer)}
                  handleCustomerClick={handleCustomerClick}
                />
              </div>
            );
          })}
    </div>
  );
};

export default CustomerLeftBar;
