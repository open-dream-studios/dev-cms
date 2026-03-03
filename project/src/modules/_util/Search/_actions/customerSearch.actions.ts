// project/src/modules/_util/Search/_actions/customerSearch.actions.ts
import { Customer, User } from "@open-dream/shared"; 
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { formatPhone } from "@/util/functions/Customers";
import { AppTheme } from "@/util/appTheme";
import { useSearchUIStore } from "../_store/search.store";
import { highlightText, runSearchMatch } from "../_helpers/customerSearch.helpers";

export type ContactCardDisplay = {
  first: React.ReactNode;
  last: React.ReactNode;
  email: React.ReactNode;
  phone: React.ReactNode;
};

export function getContactCardSearchDisplay(
  customer: Customer,
  currentUser: User | null,
  currentTheme: AppTheme
): ContactCardDisplay {
  const { customerSearchContext } = useSearchUIStore.getState();

  // no search → plain display
  if (!customerSearchContext) {
    return {
      first: capitalizeFirstLetter(customer.first_name),
      last: capitalizeFirstLetter(customer.last_name),
      email: customer.email ?? "",
      phone: formatPhone(customer.phone ?? ""),
    };
  }

  const schema = customerSearchContext.schema(customer);
  const result = runSearchMatch(customerSearchContext.parsed, schema);

  const highlight = (text: string, key: string) =>
    highlightText(text, result.matched[key] ?? [], () => ({
      backgroundColor: "rgba(180,215,255,0.7)",
      color:
        currentUser?.theme === "dark"
          ? currentTheme.background_2
          : currentTheme.text_3,
    }));

  const first = highlight(capitalizeFirstLetter(customer.first_name), "first");
  const last = highlight(capitalizeFirstLetter(customer.last_name), "last");
  const email = highlight(customer.email ?? "", "email");
  const phone = highlight(formatPhone(customer.phone ?? ""), "phone");

  return {
    first:
      customerSearchContext.type === "name"
        ? first
        : capitalizeFirstLetter(customer.first_name),
    last:
      customerSearchContext.type === "name"
        ? last
        : capitalizeFirstLetter(customer.last_name),
    email: customerSearchContext.type === "email" ? email : customer.email ?? "",
    phone:
      customerSearchContext.type === "phone"
        ? phone
        : formatPhone(customer.phone ?? ""),
  };
}
