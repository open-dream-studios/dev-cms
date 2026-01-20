// project/src/modules/CustomersModule/CustomerMiniCard.tsx
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import { Customer } from "@open-dream/shared";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useContextMenuStore } from "@/store/util/contextMenuStore";
import {
  createCustomerContextMenu,
  handleCustomerClick,
} from "./_actions/customers.actions";
import { getContactCardSearchDisplay } from "../_util/Search/_actions/search.actions";

const CustomerMiniCard = ({
  customer,
  index,
  isCustomer,
}: {
  customer: Customer;
  index: number;
  isCustomer: boolean;
}) => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { currentCustomer } = useCurrentDataStore();
  const { openContextMenu } = useContextMenuStore();

  const display = getContactCardSearchDisplay(
    customer,
    currentUser,
    currentTheme
  );

  if (!currentUser) return null;

  return (
    <div
      key={index}
      onContextMenu={(e) => {
        e.preventDefault();
        openContextMenu({
          position: { x: e.clientX, y: e.clientY },
          target: customer,
          menu: createCustomerContextMenu(),
        });
      }}
      onClick={() => handleCustomerClick(customer)}
      style={{
        backgroundColor:
          currentCustomer &&
          currentCustomer.customer_id === customer.customer_id
            ? "rgba(255,255,255,0.057)"
            : "rgba(255,255,255,0.028)",
        color: currentTheme.text_3,
        borderLeft: isCustomer
          ? `2px solid ${currentTheme.app_color_1}`
          : "2px solid transparent",
      }}
      className="w-full h-[70px] pl-[10px] pr-[7px] flex flex-row gap-[10px] items-center rounded-[12px] 
            dim hover:brightness-[85%] transition cursor-pointer shadow-sm"
    >
      <div
        className="flex items-center justify-center rounded-full border font-semibold text-[13px] min-w-[33px] min-h-[33px]"
        style={{
          borderColor: currentTheme.text_4,
          color: currentTheme.text_4,
        }}
      >
        {`${customer.first_name?.[0] ?? ""}${
          customer.last_name?.[0] ?? ""
        }`.toUpperCase()}
      </div>

      <div className="flex flex-col items-start justify-start overflow-hidden h-[58px] mt-[1px]">
        <p className="w-full font-bold text-[16px] leading-[19px] truncate">
          {display.first} {display.last}
        </p>

        <div className="w-[100%] flex flex-col text-[13px] leading-[22px] opacity-70 truncate">
          {customer.email && <p className="truncate">{display.email}</p>}
          {customer.phone && <p className="truncate">{display.phone}</p>}
        </div>
      </div>
    </div>
  );
};

export default CustomerMiniCard;
