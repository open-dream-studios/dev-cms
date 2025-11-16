// project/src/modules/CustomersModule/CustomerCatalog.tsx
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import CustomerView from "./CustomerView";
import { Customer } from "@open-dream/shared";
import { formatPhone } from "@/util/functions/Customers";
import ModuleLeftBar from "../components/ModuleLeftBar";
import { useUiStore } from "@/store/useUIStore";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useCurrentTheme } from "@/hooks/useTheme";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { useContextQueries } from "@/contexts/queryContext/queryContext";

// export const CustomerMiniCard = ({
//   customer,
//   index,
//   handleContextMenu,
//   handleCustomerClick,
// }: {
//   customer: Customer;
//   index: number;
//   handleContextMenu: (e: any, customer: Customer) => void;
//   handleCustomerClick: (customer: Customer) => void;
// }) => {
//   const { currentUser } = useContext(AuthContext);
//   const currentTheme = useCurrentTheme();
//   const { currentCustomer, currentCustomerSearchTerm } = useCurrentDataStore();

//   function highlightFirstMatch(text: string, search: string) {
//     if (!search) return text;

//     const index = text.toLowerCase().indexOf(search.toLowerCase());
//     if (index === -1) return text;

//     const before = text.slice(0, index);
//     const match = text.slice(index, index + search.length);
//     const after = text.slice(index + search.length);

//     return (
//       <>
//         {before}
//         <span
//           style={{
//             backgroundColor: "rgba(255,255,0,0.35)",
//             borderRadius: "3px",
//             padding: "1px 2px",
//           }}
//         >
//           {match}
//         </span>
//         {after}
//       </>
//     );
//   }

//   if (!currentUser) return null;

//   return (
//     <div
//       key={index}
//       onContextMenu={(e) => handleContextMenu(e, customer)}
//       onClick={() => handleCustomerClick(customer)}
//       style={{
//         backgroundColor:
//           currentCustomer &&
//           currentCustomer.customer_id === customer.customer_id
//             ? "rgba(255,255,255,0.057)"
//             : "rgba(255,255,255,0.028)",
//         color: currentTheme.text_4,
//       }}
//       className="mb-[9.5px] w-full h-[70px] pl-[14px] pr-[7px] flex flex-row gap-[10px] items-center rounded-[12px]
//             dim hover:brightness-[85%] transition cursor-pointer shadow-sm"
//     >
//       <div
//         className="flex items-center justify-center rounded-full border font-semibold text-[13px] min-w-[33px] min-h-[33px]"
//         style={{
//           borderColor: currentTheme.text_4,
//           color: currentTheme.text_4,
//         }}
//       >
//         {`${customer.first_name?.[0] ?? ""}${
//           customer.last_name?.[0] ?? ""
//         }`.toUpperCase()}
//       </div>

//       <div className="flex flex-col items-start justify-start overflow-hidden h-[58px] mt-[1px]">
//         <p
//           className="w-[100%] font-bold text-[16px] leading-[19px] truncate"
//           style={{ color: currentTheme.text_4 }}
//         >
//           {highlightFirstMatch(
//             `${capitalizeFirstLetter(
//               customer.first_name
//             )} ${capitalizeFirstLetter(customer.last_name)}`,
//             currentCustomerSearchTerm || ""
//           )}
//         </p>

//         <div className="w-[100%] flex flex-col text-[13px] leading-[22px] opacity-70 truncate">
//           {customer.email && <p className="truncate">{customer.email}</p>}
//           {customer.phone && (
//             <p className="truncate">{formatPhone(customer.phone)}</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

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
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { customers } = useContextQueries();
  const { currentCustomer, currentCustomerSearchTerm } = useCurrentDataStore();

  const search = (currentCustomerSearchTerm || "").trim().toLowerCase();

  // ----------------------------------------------------------
  // Determine global match mode: first-name matches or last-name matches?
  // ----------------------------------------------------------
  const anyFirstMatches =
    search.length > 0 &&
    customers.some((c) => c.first_name?.toLowerCase().startsWith(search));

  const globalMatchMode =
    search.length === 0 ? null : anyFirstMatches ? "first" : "last";

  // ----------------------------------------------------------
  // Highlight only beginning match in correct field
  // ----------------------------------------------------------
  function highlightBeginning(name: string, match: string) {
    const lower = name.toLowerCase();
    if (!match || !lower.startsWith(match)) return name;

    return (
      <>
        <span
          style={{
            backgroundColor: "rgba(255,255,0,0.35)",
            borderRadius: "3px",
            padding: "1px 2px",
          }}
        >
          {name.slice(0, match.length)}
        </span>
        {name.slice(match.length)}
      </>
    );
  }

  function highlightName(first: string, last: string) {
    if (!search) return `${first} ${last}`;

    if (globalMatchMode === "first") {
      return (
        <>
          {highlightBeginning(first, search)} {last}
        </>
      );
    }

    if (globalMatchMode === "last") {
      return (
        <>
          {first} {highlightBeginning(last, search)}
        </>
      );
    }

    return `${first} ${last}`;
  }

  if (!currentUser) return null;

  const first = capitalizeFirstLetter(customer.first_name || "");
  const last = capitalizeFirstLetter(customer.last_name || "");

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
        color: currentTheme.text_4,
      }}
      className="mb-[9.5px] w-full h-[70px] pl-[14px] pr-[7px] flex flex-row gap-[10px] items-center rounded-[12px] 
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
        <p
          className="w-[100%] font-bold text-[16px] leading-[19px] truncate"
          style={{ color: currentTheme.text_4 }}
        >
          {highlightName(first, last)}
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
  const { currentCustomer } = useCurrentDataStore();
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
