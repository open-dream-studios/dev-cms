// project/src/modules/GoogleModule/GoogleCalendarModule/CustomerDataManager/CustomerLeadsManager.tsx
import React, { useContext } from "react";
import { getCardStyle } from "@/styles/themeStyles";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { Plus } from "lucide-react";
import { Lead } from "@open-dream/shared";
import { useGoogleCalendarUIStore } from "../_store/googleCalendar.store";
import LeadRow from "./LeadRow";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useCustomerDataUIStore } from "./_store/customerData.store";

export const CustomerLeadsManager = () => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { leads } = useContextQueries();
  useGoogleCalendarUIStore();
  const { isAddingLead, setIsAddingLead, setEditingLead } =
    useCustomerDataUIStore();
  const { currentProjectId } = useCurrentDataStore();

  const handleCreateLeadClick = () => {
    setEditingLead(null);
    setIsAddingLead(true);
  };

  if (!currentUser || !currentProjectId) return null;

  return (
    <div
      className="rounded-2xl p-3 flex flex-col flex-1 min-h-[100%]"
      style={getCardStyle(currentUser.theme, currentTheme)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-2">
        <div
          className="flex items-end gap-[14px]"
          style={{
            color: currentTheme.text_2,
          }}
        >
          <div className="cursor-pointer select-none flex flex-col">
            <div
              className={`text-[21px] font-[600] tracking-tight dim brightness-98 cursor-pointer`}
            >
              Leads
            </div>
          </div>
        </div>

        <button
          onClick={handleCreateLeadClick}
          className="dim hover:brightness-90 cursor-pointer pl-[11px] pr-[17px] h-[26px] rounded-full
               flex items-center gap-[6px] text-[12.5px] font-[500]"
          style={{
            background: currentTheme.background_2,
            color: currentTheme.text_1,
          }}
        >
          <Plus size={14} />
          Create Lead
        </button>
      </div>

      <div
        className="mt-[6px] h-[1px] w-[100%]"
        style={{ background: currentTheme.background_3 }}
      />

      <div className="flex-1 min-h-0">
        <div className="h-full flex flex-col overflow-y-auto gap-[8px]">
          <div className="mt-[8px] flex flex-col gap-[8px]">
            {isAddingLead ? (
              <LeadRow lead={null} />
            ) : (
              leads.map((lead: Lead) => (
                <LeadRow key={lead.lead_id} lead={lead} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
