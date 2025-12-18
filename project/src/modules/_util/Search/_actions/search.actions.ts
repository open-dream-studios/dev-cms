// project/src/modules/_util/Search/_actions/search.actions.ts
import { Customer } from "@open-dream/shared";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { formatPhone } from "@/util/functions/Customers";
import { highlightText, runSearchMatch } from "@/util/functions/Search";
import { User } from "@/contexts/authContext";
import { AppTheme } from "@/util/appTheme";

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
  const { searchContext } = useCurrentDataStore.getState();

  // no search → plain display
  if (!searchContext) {
    return {
      first: capitalizeFirstLetter(customer.first_name),
      last: capitalizeFirstLetter(customer.last_name),
      email: customer.email ?? "",
      phone: formatPhone(customer.phone ?? ""),
    };
  }

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

  const first = highlight(capitalizeFirstLetter(customer.first_name), "first");
  const last = highlight(capitalizeFirstLetter(customer.last_name), "last");
  const email = highlight(customer.email ?? "", "email");
  const phone = highlight(formatPhone(customer.phone ?? ""), "phone");

  return {
    first:
      searchContext.type === "name"
        ? first
        : capitalizeFirstLetter(customer.first_name),
    last:
      searchContext.type === "name"
        ? last
        : capitalizeFirstLetter(customer.last_name),
    email: searchContext.type === "email" ? email : customer.email ?? "",
    phone:
      searchContext.type === "phone"
        ? phone
        : formatPhone(customer.phone ?? ""),
  };
}
