// project/src/modules/CustomersModule/CustomersModuleLeftBar.tsx
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import Divider from "@/lib/blocks/Divider";
import React, { useContext, useRef, useState } from "react";
import { FaChevronDown, FaPlus } from "react-icons/fa6";
import { useUiStore } from "@/store/useUIStore";
import {
  setCurrentCustomerData,
  useCurrentDataStore,
} from "@/store/currentDataStore";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { GoSync } from "react-icons/go";
import { useQueryClient } from "@tanstack/react-query";
import SearchBar from "../components/SearchBar";
import { handleCustomerClick } from "../CustomersModule/_actions/customers.actions";
import CustomerCatalog from "./CustomerCatalog";
import { motion } from "framer-motion";
import { homeLayoutLeftBarTopHeight } from "@/layouts/homeLayout";
import {
  ContactFilter,
  contactFilterOptions,
  useCustomerUiStore,
} from "./_store/customers.store";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { useOutsideClick } from "@/hooks/util/useOutsideClick";

const CustomersModuleLeftBar = () => {
  const queryClient = useQueryClient();
  const { currentProject, currentCustomer } = useCurrentDataStore();
  const { currentUser } = useContext(AuthContext);
  const { refetchCustomers, runModule } = useContextQueries();
  const { currentProjectId } = useCurrentDataStore();
  const { setUpdatingLock, setAddingCustomer } = useUiStore();
  const currentTheme = useCurrentTheme();
  const { contactsFilter, setContactsFilter } = useCustomerUiStore();
  const customerFilterPopupRef = useRef<HTMLDivElement | null>(null);

  useOutsideClick(customerFilterPopupRef, () => setOpen(false));

  const triggerRef = useRef<HTMLDivElement | null>(null);
  const chevronRef = useRef<HTMLDivElement | null>(null);

  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});

  const [open, setOpen] = useState(false);

  const select = (v: ContactFilter) => {
    setContactsFilter(v);
    setOpen(false);
    console.log(v);
  };

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

  const [isHoveredOver, setIsHoveredOver] = useState(false);

  if (!currentUser) return null;

  return (
    <div
      className={`hidden md:flex w-[100%] h-full flex-col min-h-0 overflow-hidden`}
      style={{
        borderRight: `0.5px solid ${currentTheme.background_2}`,
      }}
    >
      <div className="flex flex-col pb-[8px]">
        <motion.div
          className={`relative group px-[15px] flex flex-row items-center justify-between pt-[12px] pb-[6px] ${
            currentCustomer && "cursor-pointer"
          }`}
          style={{
            height: homeLayoutLeftBarTopHeight + 2,
          }}
          animate={{
            backgroundColor: isHoveredOver
              ? currentTheme.background_2
              : currentTheme.background_1,
          }}
          onHoverStart={() => {
            if (currentCustomer) {
              setIsHoveredOver(true);
            }
          }}
          onHoverEnd={() => {
            setIsHoveredOver(false);
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          onClick={() => {
            if (currentCustomer) {
              setCurrentCustomerData(null, false);
              setAddingCustomer(false);
            }
          }}
        >
          <div className="flex flex-row justify-between items-center w-[100%]">
            <div className="relative inline-block">
              {/* <div
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((p) => !p);
                }}
                className={`${
                  currentCustomer ? "h-[30px]" : "h-[42px]"
                }  flex items-center cursor-pointer hover:brightness-75 dim select-none gap-[6px]`}
              > */}
              <div
                ref={triggerRef}
                onClick={(e) => {
                  e.stopPropagation();

                  if (!open && triggerRef.current && chevronRef.current) {
                    const triggerRect =
                      triggerRef.current.getBoundingClientRect();
                    const chevronRect =
                      chevronRef.current.getBoundingClientRect();

                    const popupHeight = contactFilterOptions.length * 26 + 4;

                    setPopupStyle({
                      top:
                        triggerRect.top +
                        triggerRect.height / 2 -
                        popupHeight / 2,
                      left: chevronRect.right + 6,
                    });
                  }

                  setOpen((p) => !p);
                }}
                className={`${
                  currentCustomer ? "h-[30px]" : "h-[42px]"
                } flex items-center cursor-pointer hover:brightness-75 dim select-none gap-[6px]`}
              >
                <p className="w-[100%] font-[600] h-[30px] truncate text-[22px] leading-[25px]">
                  {capitalizeFirstLetter(contactsFilter)}
                </p>

                <div ref={chevronRef} className="flex items-center">
                  <FaChevronDown
                    size={16}
                    className={`transition-transform duration-200 mt-[-2.5px] opacity-[0.3] ${
                      open ? "rotate-[-90deg]" : "rotate-0"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-row gap-[6px]">
              <div
                onClick={handleCustomerSync}
                className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
                style={{
                  backgroundColor: currentTheme.background_1_2,
                }}
              >
                <GoSync size={12} className="rotate-[50deg]" />
              </div>

              <div
                onClick={() => handleCustomerClick(null)}
                className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
                style={{
                  backgroundColor: currentTheme.background_1_2,
                }}
              >
                <FaPlus size={12} />
              </div>
            </div>
          </div>

          {open && (
            <div
              ref={customerFilterPopupRef}
              style={{
                backgroundColor: currentTheme.background_2,
                position: "fixed",
                ...popupStyle,
              }}
              className="z-[1000] min-w-[140px] rounded-[7px] shadow-lg pt-[2.5px] pb-[3px]"
            >
              {contactFilterOptions.map((opt, index) => (
                <div key={opt} className="px-[8px]">
                  {index !== 0 && (
                    <div
                      className="w-[100%] h-[1px] rounded-[4px] opacity-[0.4]"
                      style={{ backgroundColor: currentTheme.background_4 }}
                    />
                  )}
                  <div
                    onClick={() => {
                      setIsHoveredOver(false);
                      select(opt);
                    }}
                    className="px-[3px] pb-[2px] pt-[3px] opacity-[0.65] text-[14px] font-[600] dim hover:brightness-65 cursor-pointer whitespace-nowrap"
                  >
                    {capitalizeFirstLetter(opt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <div className="px-[15px] mt-[-1px] z-[20]">
          <Divider />
          <div className="mt-[8px] h-[26px]">
            <SearchBar />
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
