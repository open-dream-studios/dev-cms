// project/src/modules/PaymentsModule/_actions/payments.actions.ts
import { Customer } from "@open-dream/shared";
import { Screen } from "@open-dream/shared";
import { setCurrentCustomerData } from "@/store/currentDataStore";

export async function openCustomerFromPayments(
  customer: Customer | null,
  screenClick: (screen: Screen, path: string) => Promise<void>
) {
  if (!customer) return;
  setCurrentCustomerData(customer, true);
  await screenClick("customers", "/");
}
