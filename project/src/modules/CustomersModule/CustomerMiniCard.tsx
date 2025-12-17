// project/src/modules/CustomersModule/CustomerMiniCard.tsx
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import { Customer } from "@open-dream/shared";
import { formatPhone } from "@/util/functions/Customers";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useCurrentTheme } from "@/hooks/useTheme";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { highlightText, runSearchMatch } from "@/util/functions/Search";
import { useContextMenuStore } from "@/store/util/contextMenuStore";
import { useQueryClient } from "@tanstack/react-query";
import { createCustomerContextMenu } from "./_actions/customers.actions";

const CustomerMiniCard = ({
  customer,
  index,
  handleCustomerClick,
}: {
  customer: Customer;
  index: number;
  handleCustomerClick: (customer: Customer) => void;
}) => {
  const queryClient = useQueryClient();
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { currentCustomer, searchContext } = useCurrentDataStore();
  const { openContextMenu } = useContextMenuStore();

  let display;

  if (!searchContext) {
    display = {
      first: capitalizeFirstLetter(customer.first_name),
      last: capitalizeFirstLetter(customer.last_name),
      email: customer.email ?? "",
      phone: formatPhone(customer.phone ?? ""),
    };
  } else {
    const schema = searchContext.schema(customer);
    const result = runSearchMatch(searchContext.parsed, schema);

    const highlight = (text: string, key: string) =>
      highlightText(text, result.matched[key] ?? [], () => ({
        backgroundColor: "rgba(180,215,255,0.7)",
        color:
          currentUser?.theme === "dark"
            ? currentTheme.background_2
            : currentTheme.text_3,
      }));

    const nameFirst = highlight(
      capitalizeFirstLetter(customer.first_name),
      "first"
    );
    const nameLast = highlight(
      capitalizeFirstLetter(customer.last_name),
      "last"
    );
    const email = highlight(customer.email ?? "", "email");
    const phone = highlight(formatPhone(customer.phone ?? ""), "phone");

    display = {
      first:
        searchContext.type === "name"
          ? nameFirst
          : capitalizeFirstLetter(customer.first_name),
      last:
        searchContext.type === "name"
          ? nameLast
          : capitalizeFirstLetter(customer.last_name),
      email: searchContext.type === "email" ? email : customer.email ?? "",
      phone:
        searchContext.type === "phone"
          ? phone
          : formatPhone(customer.phone ?? ""),
    };
  }

  if (!currentUser) return null;

  return (
    <div
      key={index}
      onContextMenu={(e) => {
        e.preventDefault();
        openContextMenu({
          position: { x: e.clientX, y: e.clientY },
          target: customer,
          menu: createCustomerContextMenu(queryClient),
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
      }}
      className="w-full h-[70px] pl-[14px] pr-[7px] flex flex-row gap-[10px] items-center rounded-[12px] 
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
