// project/src/modules/TimelineModule/CustomerInteractionTimeline.tsx
import React from "react";
import { useCustomerInteractions } from "./useCustomerInteractions";
import { InteractionList } from "./InteractionList";
import { InteractionDetailPanel } from "./InteractionDetailPanel";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useCurrentTheme } from "@/hooks/useTheme";

export function CustomerInteractionTimeline() {
  const { currentCustomer } = useCurrentDataStore();
  const currentTheme = useCurrentTheme();
  const { interactions } = useCustomerInteractions(
    currentCustomer ? currentCustomer.email : null,
    currentCustomer ? currentCustomer.customer_id : null
  );
  console.log(interactions);

  return (
    <div className="grid h-full grid-cols-[360px_1fr] border rounded-xl overflow-hidden bg-background">
      <div
        className="border-r"
        style={{ backgroundColor: currentTheme.background_1 }}
      >
        <InteractionList interactions={interactions} />
      </div>

      <div className="bg-card">
        <InteractionDetailPanel />
      </div>
    </div>
  );
}
