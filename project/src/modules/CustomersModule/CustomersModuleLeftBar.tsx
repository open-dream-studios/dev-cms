// project/src/modules/CustomersModule/CustomersModuleLeftBar.tsx
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import Divider from "@/lib/blocks/Divider";
import React, { useContext } from "react";
import { FaPlus } from "react-icons/fa6";
import { useUiStore } from "@/store/useUIStore";
import {
  setCurrentCustomerData,
  useCurrentDataStore,
} from "@/store/currentDataStore";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useQueryClient } from "@tanstack/react-query";
import SearchBar from "../_util/Search/SearchBar";
import { handleCustomerClick } from "../CustomersModule/_actions/customers.actions";
import CustomerCatalog from "./CustomerCatalog";
import { homeLayoutLeftBarTopHeight } from "@/layouts/homeLayout";
import { ContactFilter, useCustomerUiStore } from "./_store/customers.store";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { CustomersScreen, ValidSearchModule } from "@open-dream/shared";

const CustomersModuleLeftBarTab = ({ tab }: { tab: CustomersScreen }) => {
  const currentTheme = useCurrentTheme();
  const { setAddingCustomer } = useUiStore();
  const { customersScreen, setCustomersScreen } = useCustomerUiStore();

  const isActive = customersScreen === tab;

  return (
    <div
      className="select-none group w-full h-[40px] rounded-[10px] cursor-pointer flex items-center justify-between px-[14px] mb-[6px] transition-all duration-200"
      style={{ backgroundColor: "rgba(255,255,255,0.028)" }}
      onClick={() => {
        setAddingCustomer(false);
        setCurrentCustomerData(null, false);
        setCustomersScreen(tab);
      }}
    >
      <div
        style={{ backgroundColor: currentTheme.app_color_1 }}
        className={`absolute left-0 h-[24px] w-[3px] rounded-r-full transition-opacity duration-200 ${
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"
        }`}
      />

      <p className="text-[14.5px] font-[600] tracking-[0.2px] opacity-[0.85] group-hover:opacity-100 transition-all duration-200">
        {capitalizeFirstLetter(tab)}
      </p>

      <svg
        className="w-[14px] h-[14px] opacity-40 group-hover:opacity-70 transition-all duration-200"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </div>
  );
};

const CustomersModuleLeftBar = () => {
  const queryClient = useQueryClient();
  const { currentProject, currentCustomer, currentProjectId } =
    useCurrentDataStore();
  const { currentUser } = useContext(AuthContext);
  const { refetchCustomers, runModule } = useContextQueries();
  const { setUpdatingLock } = useUiStore();
  const currentTheme = useCurrentTheme();
  const { contactsFilter, setContactsFilter } = useCustomerUiStore();

  const handleCustomerSync = async () => {
    setUpdatingLock(true);
    if (currentProject) {
      await runModule("customer-google-wave-sync-module", {});
      refetchCustomers();
      setUpdatingLock(false);
      queryClient.invalidateQueries({
        queryKey: ["customers", currentProjectId],
      });
    }
  };

  if (!currentUser) return null;

  return (
    <div
      className={`hidden md:flex w-[100%] h-full flex-col min-h-0 overflow-hidden`}
      style={{
        borderRight: `0.5px solid ${currentTheme.background_2}`,
      }}
    >
      <div className="flex flex-col pb-[8px]">
        <div
          className={`relative group px-[15px] flex flex-row items-center justify-between pt-[12px] pb-[6px] ${
            currentCustomer && "cursor-pointer"
          }`}
          style={{
            height: homeLayoutLeftBarTopHeight + 2,
          }}
        >
          <div className="flex flex-row justify-between items-center w-[100%]">
            <div className="relative inline-block">
              <div
                className={`h-[30px] flex items-center select-none gap-[6px]`}
              >
                <p className="w-[100%] font-[600] h-[30px] truncate text-[22px] leading-[25px]">
                  Customers
                </p>
              </div>
            </div>

            <div className="flex flex-row gap-[6px]">
              {/* <div
                onClick={handleCustomerSync}
                className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
                style={{
                  backgroundColor: currentTheme.background_1_3,
                }}
              >
                <GoSync size={12} className="rotate-[50deg]" />
              </div> */}

              <div
                onClick={() => handleCustomerClick(null)}
                className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
                style={{
                  backgroundColor: currentTheme.background_1_3,
                }}
              >
                <FaPlus size={12} />
              </div>
            </div>
          </div>
        </div>

        <div className="px-[15px] mt-[-1px] z-[20]">
          <Divider />

          <div className="mb-[9px] mt-[9px]">
            <CustomersModuleLeftBarTab tab="service" />
            <CustomersModuleLeftBarTab tab="cleanings" />
            <CustomersModuleLeftBarTab tab="subscriptions" />
            <CustomersModuleLeftBarTab tab="leads" />
          </div>

          <Divider />

          <div
            className="mt-[8px] w-full h-[34px] flex gap-[6px] p-[4px] rounded-[10px]"
            style={{
              backgroundColor:
                currentUser.theme === "dark"
                  ? "rgba(255,255,255,0.06)"
                  : currentTheme.background_1_3,
            }}
          >
            {/* CONTACTS */}
            <div
              onClick={() => setContactsFilter("contacts" as ContactFilter)}
              className={`w-full h-full flex items-center justify-center text-[13px] font-[600] rounded-[8px] cursor-pointer transition-all duration-200 ${
                contactsFilter === "contacts"
                  ? "shadow-sm"
                  : "opacity-70 hover:opacity-100"
              }`}
              style={{
                backgroundColor:
                  contactsFilter === "contacts"
                    ? currentTheme.background_3
                    : "transparent",
              }}
            >
              <p>Contacts</p>
            </div>

            {/* CUSTOMERS */}
            <div
              onClick={() => setContactsFilter("customers" as ContactFilter)}
              className={`w-full h-full flex items-center justify-center text-[13px] font-[600] rounded-[8px] cursor-pointer transition-all duration-200 ${
                contactsFilter === "customers"
                  ? "shadow-sm"
                  : "opacity-70 hover:opacity-100"
              }`}
              style={{
                backgroundColor:
                  contactsFilter === "customers"
                    ? currentTheme.background_3
                    : "transparent",
              }}
            >
              <p>Customers</p>
            </div>
          </div>

          <div className="mt-[6px] h-[28px]">
            <SearchBar module={"customers-module" as ValidSearchModule}/>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 h-[100%]">
        <CustomerCatalog />
      </div>
    </div>
  );
};

export default CustomersModuleLeftBar;
