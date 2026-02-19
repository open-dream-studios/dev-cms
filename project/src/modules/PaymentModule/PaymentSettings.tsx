// project/src/modules/PaymentModule/Settings.tsx
"use client"
import React, { useContext, useState } from "react"; 
import { AuthContext } from "../../contexts/authContext";
import Subscription from "./Subscription";
import Account from "./Account";
import Billing from "./Billing";
import { makeRequest } from "../../util/axios";
import { useQuery } from "@tanstack/react-query";
import { useCurrentTheme } from "@/hooks/util/useTheme";

type SettingsProps = {
  initialPage: SettingsPages | null;
};

type SettingsPages = "Account" | "Subscription" | "Billing" | "Settings";

const PaymentSettings = ({ initialPage }: SettingsProps) => {
  const currentTheme = useCurrentTheme()
  const { currentUser } = useContext(AuthContext);
  const [selectedPage, setSelectedPage] = useState<SettingsPages>(
    initialPage === null ? "Account" : initialPage
  );
  const settingsPages: SettingsPages[] = [
    "Account",
    "Subscription",
    "Billing",
    "Settings",
  ];

  const { data: currentUserBillingData } = useQuery<any>({
    queryKey: ["currentUserBilling"],
    queryFn: async () => {
      const res = await makeRequest.get("/api/users/current-billing");
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });

  if (!currentUser) return;

  return (
    <div className="w-full h-full flex flex-row">
      <div className="select-none w-[25%] min-w-[200px] h-full pl-[30px] py-[30px]">
        <div
          className="font-[600] text-[25px] leading-[18px] h-[35px]"
          style={{ color: currentTheme.text_1 }}
        >
          Settings
        </div>
        <div className="mt-[1px] flex-1 h-[calc(100%-35px)] pr-[30px] flex flex-col gap-[7px]">
          {settingsPages.map((item: string, index: number) => {
            const isSelected = selectedPage === settingsPages[index];
            return (
              <div
                key={index}
                onClick={() => setSelectedPage(settingsPages[index])}
                className="cursor-pointer w-full h-[40px] rounded-[10px] transition-colors duration-500 group"
                style={{
                  backgroundColor: isSelected
                    ? currentTheme.background_2_2
                    : currentTheme.background_1_2,
                }}
              >
                <div
                  className="w-full h-full group-hover:bg-[var(--hover-bg)] rounded-[10px] flex justify-left items-center px-[15px] truncate font-[500] text-[16px]"
                  style={
                    {
                      transition: "background-color 0.2s ease-in-out",
                      "--hover-bg": currentTheme.background_2_2,
                    } as React.CSSProperties
                  }
                >
                  {settingsPages[index]}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="w-[75%] h-full max-w-[calc(100%-200px)]">
        {selectedPage === "Account" && <Account />}
        {selectedPage === "Subscription" && <Subscription />}
        {selectedPage === "Billing" && (
          <Billing currentUserBilling={currentUserBillingData} />
        )}
      </div>
    </div>
  );
};

export default PaymentSettings;
