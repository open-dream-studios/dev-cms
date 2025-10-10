// project/src/modules/CustomersModule/CustomerCatalog.tsx
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext"; 
import { appTheme } from "@/util/appTheme";
import CustomerView from "./CustomerView";
import { Customer } from "@/types/customers";
import { formatPhone } from "@/util/functions/Customers";
import ModuleLeftBar from "../components/ModuleLeftBar";
import { useUiStore } from "@/store/UIStore";
import { useCurrentDataStore } from "@/store/currentDataStore";

export const CustomerMiniCard = ({
  customer,
  index,
  handleContextMenu,
  handleCustomerClick,
}: {
  customer: Customer;
  index: number;
  handleContextMenu: (e: any, customer: Customer) => void;
  handleCustomerClick: (customer: Customer) => void;
}) => {
  const { currentCustomer } = useCurrentDataStore();
  const { currentUser } = useContext(AuthContext);
  if (!currentUser) return null;

  return (
    <div
      key={index}
      onContextMenu={(e) => handleContextMenu(e, customer)}
      onClick={() => handleCustomerClick(customer)}
      style={{
        backgroundColor:
          currentCustomer &&
          currentCustomer.customer_id === customer.customer_id
            ? "rgba(255,255,255,0.057)"
            : "rgba(255,255,255,0.028)",
        color: appTheme[currentUser.theme].text_4,
      }}
      className="mb-[9.5px] w-full h-[70px] pl-[14px] pr-[7px] flex flex-row gap-[10px] items-center rounded-[12px] 
             hover:brightness-[85%] transition cursor-pointer shadow-sm"
    >
      <div
        className="flex items-center justify-center rounded-full border font-semibold text-[13px] min-w-[33px] min-h-[33px]"
        style={{
          borderColor: appTheme[currentUser.theme].text_4,
          color: appTheme[currentUser.theme].text_4,
        }}
      >
        {`${customer.first_name?.[0] ?? ""}${
          customer.last_name?.[0] ?? ""
        }`.toUpperCase()}
      </div>

      <div className="flex flex-col items-start justify-start overflow-hidden h-[58px] mt-[1px]">
        <p
          className="w-[100%] font-bold text-[16px] leading-[19px] truncate"
          style={{ color: appTheme[currentUser.theme].text_4 }}
        >
          {customer.first_name} {customer.last_name}
        </p>

        <div className="w-[100%] flex flex-col text-[13px] leading-[22px] opacity-70 truncate">
          {customer.email && <p className="truncate">{customer.email}</p>}
          {customer.phone && (
            <p className="truncate">{formatPhone(customer.phone)}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const CustomerCatalog = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId } = useCurrentDataStore();
  const { currentCustomer } = useCurrentDataStore()
  const { addingCustomer } = useUiStore();

  if (!currentUser || !currentProjectId) return null;

  return (
    <div className="flex w-full h-[100%]">
      <ModuleLeftBar />
      <div className="flex-1">
        {(currentCustomer || addingCustomer) && <CustomerView />}
      </div>
    </div>
  );
};

export default CustomerCatalog;
