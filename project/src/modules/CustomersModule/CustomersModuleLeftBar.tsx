// project/src/modules/CustomersModule/CustomersModuleLeftBar.tsx
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import Divider from "@/lib/blocks/Divider";
import React, { useContext } from "react";
import { FaPlus } from "react-icons/fa6";
import { useUiStore } from "@/store/useUIStore";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { GoSync } from "react-icons/go";
import { useQueryClient } from "@tanstack/react-query";
import SearchBar from "../components/SearchBar"; 
import { handleCustomerClick } from "../CustomersModule/_actions/customers.actions";
import { homeLayoutLeftBarTopHeight } from "@/layouts/homeLayout";
import CustomerCatalog from "./CustomerCatalog";

const CustomersModuleLeftBar = () => {
  const queryClient = useQueryClient();
  const { currentProject } = useCurrentDataStore();
  const { currentUser } = useContext(AuthContext);
  const { refetchCustomers, runModule } = useContextQueries();
  const { currentProjectId } = useCurrentDataStore();
  const { setUpdatingLock } = useUiStore();
  const currentTheme = useCurrentTheme();

  const handlePlusClick = async () => {
    handleCustomerClick(queryClient, null);
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

  if (!currentUser) return null;

  return (
    <div
      className={`hidden md:flex w-[240px] min-w-[240px] h-full flex-col min-h-0 overflow-hidden`}
      style={{
        borderRight: `0.5px solid ${currentTheme.background_2}`,
      }}
    >
      <div className="flex flex-col px-[15px] pb-[8px]">
        <div
          className="flex flex-row items-center justify-between pt-[12px] pb-[6px]"
          style={{
            height: homeLayoutLeftBarTopHeight,
          }}
        >
          <div className="select-none flex flex-row gap-[13.5px] items-center w-[100%]">
            <p className="w-[100%] font-[600] h-[40px] truncate text-[24px] leading-[30px] mt-[1px]">
              Customers
            </p>
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
              onClick={handlePlusClick}
              className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
              style={{
                backgroundColor: currentTheme.background_1_2,
              }}
            >
              <FaPlus size={12} />
            </div>
          </div>
        </div>
        <Divider />
        <div className="mt-[8px] h-[26px]">
          <SearchBar />
        </div>
      </div>

      <div className="flex-1 min-h-0 h-[100%]">
        <CustomerCatalog />
      </div>
    </div>
  );
};

export default CustomersModuleLeftBar;
