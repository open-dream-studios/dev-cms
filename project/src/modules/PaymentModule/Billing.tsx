// project/src/modules/PaymentModule/Billing.tsx
"use client";
import { useContext } from "react";
import { capitalizeFirstLetter, formatDate } from "../../util/functions/Data";
import {
  formatStripeAmount,
  formatStripeDate,
} from "./_helpers/payments.helpers";
import { AuthContext } from "../../contexts/authContext";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { BillingTransaction } from "./PaymentSettings";

type BillingProps = {
  currentUserBilling: BillingTransaction[] | null | undefined;
};

const Billing = ({ currentUserBilling }: BillingProps) => {
  const currentTheme = useCurrentTheme();
  const { currentUser } = useContext(AuthContext);
  if (!currentUser) return;
  return (
    <div className="w-full h-full flex flex-col pt-[50px]">
      <div className="w-[90%] ml-[1%] md:ml-[2%] flex flex-col items-center justify-center">
        <p className="font-[600] lg:mb-[18px] mb-[15px] text-[29px] leading-[29px] md:text-[32px] md:leading-[32px] w-[100%] items-start">
          Billing
        </p>
      </div>
      {currentUserBilling && currentUserBilling.length > 0 && (
        <div className="flex h-[calc(100%-55px)] pl-[20px] w-full flex-col gap-[10px] mt-[15px] overflow-auto pb-[40px] pr-[50px]">
          {[...currentUserBilling].map(
            (billingItem: BillingTransaction, index: number) => {
              // const billingDate = formatStripeDate(billingItem.stripe_created_at);
              const billingDate = new Date(
                billingItem.created,
              ).toLocaleDateString();

              return (
                <div
                  key={index}
                  className="w-full min-h-[40px] px-[10px] rounded-[5px] flex flex-row justify-between items-center"
                  style={{
                    backgroundColor: currentTheme.background_2_2,
                    color: currentTheme.text_1,
                  }}
                >
                  <div>
                    {capitalizeFirstLetter(billingItem.type)} | {billingDate}
                  </div>
                  <div>
                    <>${billingItem.amount.toFixed(2)} | </>
                    <>{capitalizeFirstLetter(billingItem.status)}</>
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}
    </div>
  );
};

export default Billing;
