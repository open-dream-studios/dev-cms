// project/src/modules/DashboardModule/components/GoogleAdsTopBar.tsx
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { AuthContext } from "@/contexts/authContext";
import { useCurrentTheme } from "@/hooks/useTheme";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { formatPhone } from "@/util/functions/Customers";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { openWindow } from "@/util/functions/Handlers";
import { useGoogleUIStore, useGoogleDataStore } from "../../_googleStore";
import SmoothSkeleton from "@/lib/skeletons/SmoothSkeleton";

const GoogleAdsTopBar = () => {
  const { currentUser } = useContext(AuthContext);
  const {
    googleAdsData,
    selectedCampaignId,
    setSelectedCampaignId,
    setCurrentGoogleAdsRange,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    currentGoogleAdsRange,
  } = useGoogleDataStore();
  const { isLoadingGoogleAdsData } = useGoogleUIStore();
  const { runModule } = useContextQueries();
  const { showCampaignPicker, setShowCampaignPicker } = useGoogleUIStore();
  const [editingBudget, setEditingBudget] = useState(false);
  const [editedBudgetValue, setEditedBudgetValue] = useState<string>("");
  const currentTheme = useCurrentTheme();
  const budgetInputRef = useRef<HTMLInputElement | null>(null);
  const campaignPopupRef = useRef<HTMLDivElement | null>(null);

  useOutsideClick(campaignPopupRef, () => setShowCampaignPicker(false));

  useEffect(() => {
    if (editingBudget && budgetInputRef.current) {
      budgetInputRef.current.focus();
    }
  }, [editingBudget]);

  const campaignsList = useMemo(() => {
    if (!googleAdsData) return [];
    const c = googleAdsData.campaigns;
    if (Array.isArray(c)) return c;
    if (c && Array.isArray(c.campaigns)) return c.campaigns;
    return [];
  }, [googleAdsData]);

  const activeCampaign = useMemo(() => {
    if (!googleAdsData) return [];
    return (
      campaignsList.find((c) => String(c.id) === String(selectedCampaignId)) ??
      googleAdsData?.activeCampaign ??
      null
    );
  }, [googleAdsData, campaignsList, selectedCampaignId]);

  const displayBudget = activeCampaign?.budget ?? 0;

  const handleSetBudget = async () => {
    const normalized = editedBudgetValue === "" ? "0" : editedBudgetValue;
    const parsed = Number(normalized);
    if (activeCampaign && activeCampaign.id) {
      // console.log(activeCampaign.id, parsed);
      // await onSaveBudget(activeCampaign.id, parsed);
      // setShowLayoutSkeleton(true);
      await runModule("google-ads-api-module", {
        action: "setCampaignBudget",
        params: {
          campaignId: activeCampaign.id,
          amount: parsed,
        },
      })
        .then(async (res: any) => {
          // setData(res);
          // setBudgetSavedToast("Budget updated!");
          // setTimeout(() => setBudgetSavedToast(null), 2000);
          // await fetchGoogleAdsData();
        })
        .catch((e: any) => console.error(e));
      // .finally(() => setShowLayoutSkeleton(false));
    }
    setEditingBudget(false);
  };

  const handleRangeChange = (r: typeof currentGoogleAdsRange) =>
    setCurrentGoogleAdsRange(r);

  if (!currentUser) return null;

  if (isLoadingGoogleAdsData) {
    return <SmoothSkeleton />;
  }

  return (
    <div className="pl-[4px] w-[100%] h-[100%] flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div
          onClick={() => {
            if (
              googleAdsData &&
              selectedCampaignId &&
              googleAdsData.customerId
            ) {
              openWindow(
                `https://ads.google.com/aw/overview?customerId=${googleAdsData.customerId}#~campaign/id=${selectedCampaignId}`
              );
            }
          }}
          className="group cursor-pointer dim hover:brightness-85 flex items-center gap-3"
        >
          <div
            className="rounded-full flex items-center justify-center w-[55px] h-[55px]"
            style={{
              background:
                currentUser?.theme === "dark"
                  ? currentTheme.background_2
                  : currentTheme.card_bg_1,
            }}
          >
            <img
              className="w-[auto] h-[31px]"
              alt=""
              src="https://dev-cms-project-media.s3.us-east-1.amazonaws.com/global/google-ads-logo.png"
            />
          </div>
          <div className="group-hover:brightness-85 dim">
            <div
              style={{ color: currentTheme.text_1 }}
              className="font-semibold text-[24px] mt-[-3px]"
            >
              Google Ads
            </div>
            <div
              style={{ color: currentTheme.text_2 }}
              className="text-[13px] mt-[1px]"
            >
              Account{" "}
              {googleAdsData && googleAdsData.customerId
                ? formatPhone(googleAdsData.customerId)
                : "..."}
            </div>
          </div>
        </div>

        <div className="relative w-[auto]">
          <div
            className="h-[68px] group cursor-pointer hover:brightness-93 dim flex items-center gap-3 flex-row ml-[2px] pl-[15px] pr-[17px] mt-[2px] rounded-2xl"
            style={{ background: currentTheme.card_bg_1 }}
            onClick={() => setShowCampaignPicker(true)}
          >
            <div
              className="w-[32px] h-[32px] rounded-full flex items-center justify-center mb-[2px] pt-[1px]"
              style={{
                backgroundColor:
                  currentUser.theme === "dark"
                    ? currentTheme.background_2
                    : "#f1f1f1",
              }}
            >
              <ChevronDown
                size={28}
                color={
                  currentUser.theme === "dark"
                    ? currentTheme.background_4
                    : currentTheme.text_3
                }
                className={`${
                  currentUser.theme === "dark" ? "opacity-30" : "opacity-20"
                }`}
              />
            </div>
            <div className="min-w-[220px] group-hover:brightness-79 dim mt-[-2px] ml-[1px]">
              <div
                style={{ color: currentTheme.text_1 }}
                className="font-semibold"
              >
                {activeCampaign?.name ?? "—"}
              </div>
              <div
                style={{ color: currentTheme.text_2 }}
                className="text-xs mt-1"
              >
                {`Campaign ${
                  activeCampaign && activeCampaign.id ? "ID:" : ""
                } ${activeCampaign?.id ?? "—"} ${
                  activeCampaign && activeCampaign.id ? "•" : ""
                } `}
                <span
                  style={{
                    color: activeCampaign?.status === 2 ? "#22c55e" : "#94a3b8",
                  }}
                  className="font-medium"
                >
                  {activeCampaign && activeCampaign.id
                    ? activeCampaign.status === 2
                      ? "Active"
                      : "Paused"
                    : "Status"}
                </span>
              </div>
            </div>

            {!editingBudget ? (
              <div
                onClick={(e: any) => {
                  e.stopPropagation();
                  if (activeCampaign && activeCampaign.id) {
                    setEditedBudgetValue(String(displayBudget));
                    setEditingBudget(true);
                  }
                }}
                className="flex items-center gap-[4px] pt-[4px] flex-col"
              >
                <div className="text-xs text-slate-400">Budget</div>
                <div
                  className="font-semibold ml-2"
                  style={{
                    color: currentTheme.text_1,
                  }}
                >
                  <span
                    className={`${
                      activeCampaign && activeCampaign.id
                        ? ""
                        : "text-slate-400"
                    }`}
                  >
                    {`$${
                      activeCampaign && activeCampaign.id
                        ? Number(displayBudget).toLocaleString()
                        : ""
                    } `}
                  </span>
                  <span className="text-xs text-slate-400">/ day</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-[6px] flex-col mt-[1px] ml-[5px]">
                <div className="flex flex-row gap-[4px]">
                  <button
                    onClick={(e: any) => {
                      e.stopPropagation();
                      handleSetBudget();
                    }}
                    className="cursor-pointer hover:brightness-80 dim px-[17px] h-[23px] rounded-[8px] text-[12px] font-semibold bg-gradient-to-r from-[#06b6d4] to-[#7c3aed] text-white"
                  >
                    Save
                  </button>
                  <button
                    onClick={(e: any) => {
                      e.stopPropagation();
                      setEditingBudget(false);
                    }}
                    className="cursor-pointer hover:brightness-95 dim px-2 h-[23px] rounded-md text-sm"
                    style={{
                      background: currentTheme.background_2,
                      color: currentTheme.text_1,
                    }}
                  >
                    <X size={15} color={currentTheme.text_1} />
                  </button>
                </div>
                <div
                  className="font-semibold flex flex-row items-center"
                  style={{ color: currentTheme.text_1 }}
                >
                  <div
                    className="flex flex-row gap-[3px] px-2 h-[25px] rounded-md w-[60px] text-sm mr-[5px] items-center"
                    style={{
                      background: currentTheme.background_2,
                      color: currentTheme.text_1,
                    }}
                  >
                    <p>$</p>
                    <input
                      ref={budgetInputRef}
                      value={editedBudgetValue}
                      onChange={(e) => {
                        let val = e.target.value;

                        // 1. Remove all non-digits
                        val = val.replace(/\D/g, "");

                        // 2. Max length = 2
                        if (val.length > 2) {
                          val = val.slice(0, 2);
                        }

                        // 3. Cannot start with 0 (unless empty)
                        if (val.startsWith("0") && val.length > 1) {
                          val = val.slice(1);
                        }

                        // 4. Allow empty temporarily, but store "" until blur or save
                        setEditedBudgetValue(val);
                      }}
                      onBlur={() => {
                        // Empty → treat as 0
                        if (editedBudgetValue === "") {
                          setEditedBudgetValue("0");
                        }
                      }}
                      className="w-[100%]"
                      style={{
                        outline: "none",
                        border: "none",
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">/ day</span>
                </div>
              </div>
            )}
          </div>

          {showCampaignPicker && (
            <div
              ref={campaignPopupRef}
              className="absolute left-0 top-[75px] w-[100%] p-3 rounded-2xl shadow-lg z-40"
              style={{ background: currentTheme.card_bg_1 }}
            >
              <div className="space-y-2 max-h-64 overflow-auto">
                {campaignsList.length === 0 && (
                  <div
                    style={{ color: currentTheme.text_2 }}
                    className="text-xs"
                  >
                    No campaigns
                  </div>
                )}
                {campaignsList
                  .sort((a, b) => {
                    const aIs2 = a.status === 2 ? 0 : 1;
                    const bIs2 = b.status === 2 ? 0 : 1;
                    return aIs2 - bIs2;
                  })
                  .map((c) => {
                    const isActive = c.status === 2;
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedCampaignId(c.id);
                          setShowCampaignPicker(false);
                        }}
                        className={`p-2 rounded-md cursor-pointer flex items-center gap-3 `}
                        style={{
                          background:
                            selectedCampaignId === c.id
                              ? currentTheme.background_3
                              : currentTheme.background_2_2,
                          // border: `1px solid ${currentTheme.background_2_2}`,
                        }}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            background: isActive ? "#22c55e" : "#94a3b8",
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            style={{ color: currentTheme.text_1 }}
                            className="truncate font-medium"
                          >
                            {c.name}
                          </div>
                          <div
                            style={{ color: currentTheme.text_2 }}
                            className="text-xs truncate"
                          >
                            ID: {c.id} • Budget: {c.budget ?? "—"}
                          </div>
                        </div>
                        <div
                          className="text-xs mr-[3px]"
                          style={{ color: currentTheme.text_2 }}
                        >
                          {isActive ? "Active" : "Paused"}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-[6.5px] mt-[1px]">
          <div
            className="group rounded-lg flex flex-row justify-between items-center w-[100%] px-[15px] h-[30px] cursor-pointer"
            style={{ backgroundColor: currentTheme.card_bg_1 }}
          >
            <p className="group-hover:brightness-70 dim font-[500] text-[13px]">
              Insights
            </p>
            <img
              src={
                currentUser.theme === "dark"
                  ? "https://dev-cms-project-media.s3.us-east-1.amazonaws.com/global/openai.png"
                  : "https://dev-cms-project-media.s3.us-east-1.amazonaws.com/global/openai-dark.png"
              }
              alt=""
              className="group-hover:brightness-70 dim cursor-pointer w-[20px] h-[20px]"
            />
          </div>
          <div
            className="group w-[auto] rounded-lg px-[15px] h-[30px] flex items-center cursor-pointer"
            style={{ backgroundColor: currentTheme.card_bg_1 }}
          >
            <select
              className="group-hover:brightness-75 cursor-pointer dim min-w-[100px] py-2 rounded-lg text-sm border-none outline-none"
              onChange={(e) => handleRangeChange(e.target.value as any)}
              style={{ color: currentTheme.text_1 }}
            >
              <option value="7d">Last 7d</option>
              <option value="30d">Last 30d</option>
              <option value="90d">Last 90d</option>
            </select>
          </div>
        </div>
      </div>

      {/* <div className="flex items-center gap-3">
        <button
          onClick={() => setShowCampaignPicker(!showCampaignPicker)}
          className="px-3 py-2 rounded-lg"
          style={{
            background: "linear-gradient(90deg,#06b6d4,#7c3aed)",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          Campaigns
        </button>
      </div> */}
    </div>
  );
};

export default GoogleAdsTopBar;
