"use client";
import React, { useContext, useMemo, useState } from "react";
import { AuthContext } from "../../contexts/authContext";
import PrivacySettings from "./UserAccess";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import SiteSettings from "./SiteSettings";
import AccountSettings from "./AccountSettings";
import ModuleSettings from "./ModuleSettings";
import ProjectSettings from "./ProjectSettings";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useCurrentTheme } from "@/hooks/util/useTheme";

type SettingsProps = {
  initialPage: SettingsPages | null;
};

type SettingsPages = "Site" | "Users" | "Account" | "Modules" | "Project";

const Settings = ({ initialPage }: SettingsProps) => {
  const { currentUser } = useContext(AuthContext);
  const { projectsData } = useContextQueries();
  const { currentProject } = useCurrentDataStore();
  const [selectedPage, setSelectedPage] = useState<SettingsPages>(
    initialPage === null ? "Site" : initialPage
  );
  const currentTheme = useCurrentTheme();

  if (!currentUser) return null;

  const settingsPages: SettingsPages[] =
    currentProject !== null && projectsData.length >= 1
      ? ["Site", "Users"]
      : ["Account"];
  const adminPages: SettingsPages[] =
    currentProject !== null && projectsData.length >= 1
      ? currentUser.admin === 1
        ? ["Project", "Modules", "Account"]
        : ["Account"]
      : [];

  return (
    <div className="w-full h-full flex flex-row">
      <div className=" hidden sm:block pl-[30px] select-none w-[25%] min-w-[200px] h-full py-[30px]">
        <div
          className="font-[600] text-[25px] leading-[18px] h-[35px]"
          style={{ color: currentTheme.text_1 }}
        >
          Settings
        </div>
        <div className="mt-[1px] justify-between flex-1 h-[calc(100%-35px)] pr-[30px] flex flex-col gap-[7px]">
          <div className="flex flex-col gap-[5px]">
            {settingsPages.map((page: SettingsPages, index: number) => {
              const isSelected = selectedPage === page;
              return (
                <div
                  key={index}
                  onClick={() => setSelectedPage(page)}
                  className="cursor-pointer w-full h-[40px] rounded-[10px] transition-colors duration-200 group"
                  style={{
                    backgroundColor: isSelected
                      ? currentTheme.background_2_selected
                      : currentTheme.background_2_dim,
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

          <div className="flex flex-col gap-[5px]">
            {currentProject !== null &&
              adminPages.map((page: SettingsPages, index: number) => {
                const isSelected = selectedPage === page;
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedPage(page)}
                    className="cursor-pointer w-full h-[40px] rounded-[10px] transition-colors duration-200 group"
                    style={{
                      backgroundColor: isSelected
                        ? currentTheme.background_2_selected
                        : currentTheme.background_2_dim,
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
                      {page}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
      <div className="w-[100%] sm:w-[75%] pl-[30px] sm:pl-0 h-full sm:max-w-[calc(100%-200px)]">
        {currentProject !== null &&
          projectsData.length >= 1 &&
          selectedPage === "Site" && <SiteSettings />}
        {currentProject !== null &&
          projectsData.length >= 1 &&
          selectedPage === "Users" && <PrivacySettings />}
        {currentProject !== null &&
          projectsData.length >= 1 &&
          selectedPage === "Modules" && <ModuleSettings />}

        {selectedPage === "Project" && <ProjectSettings />}
        {selectedPage === "Account" && <AccountSettings />}
      </div>
    </div>
  );
};

export default Settings;
