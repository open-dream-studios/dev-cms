// project/src/screens/AdminHome/AdminControllers/AdminController.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import React, { useContext, useState } from "react";
import EditModules from "./EditModules";
import Divider from "@/lib/blocks/Divider";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import DefinitionsController from "./DefinitionsController";
import { resetDefinitionDisplay } from "./_actions/adminControllers.actions";

export type AdminControl =
  | "modules"
  | "pages"
  | "sections"
  | "jobs"
  | "actions";

const AdminController = () => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();

  const [controlActive, setControlActive] = useState<AdminControl>("modules");

  const handleControlClick = (control: AdminControl) => {
    setControlActive(control);
    resetDefinitionDisplay();
  };

  if (!currentUser) return null;

  return (
    <div className="w-full flex flex-col gap-2 px-[50px] py-[33px] h-full overflow-y-scroll">
      <div className="flex flex-row gap-[19px] items-center">
        <h1 className="flex -mt-1 text-[25px] md:text-[30px] font-semibold">
          Controllers
        </h1>
        <div
          style={{
            backgroundColor: currentTheme.header_1_1,
          }}
          className="flex w-[384px] pl-1 h-8 rounded-[18px] flex-row items-center"
        >
          <div
            onClick={() => handleControlClick("modules")}
            style={{
              backgroundColor:
                controlActive === "modules"
                  ? currentTheme.header_1_2
                  : "transparent",
            }}
            className="select-none cursor-pointer w-[94px] h-[26px] flex items-center justify-center text-[13px] font-medium rounded-[18px]"
          >
            Modules
          </div>
          <div
            onClick={() => handleControlClick("pages")}
            style={{
              backgroundColor:
                controlActive === "pages"
                  ? currentTheme.header_1_2
                  : "transparent",
            }}
            className="select-none cursor-pointer w-[94px] h-[26px] flex items-center justify-center text-[13px] font-medium rounded-[18px]"
          >
            Pages
          </div>
          <div
            onClick={() => handleControlClick("sections")}
            style={{
              backgroundColor:
                controlActive === "sections"
                  ? currentTheme.header_1_2
                  : "transparent",
            }}
            className="select-none cursor-pointer w-[94px] h-[26px] flex items-center justify-center text-[13px] font-medium rounded-[18px]"
          >
            Sections
          </div>
          <div
            onClick={() => handleControlClick("jobs")}
            style={{
              backgroundColor:
                controlActive === "jobs"
                  ? currentTheme.header_1_2
                  : "transparent",
            }}
            className="select-none cursor-pointer w-[94px] h-[26px] flex items-center justify-center text-[13px] font-medium rounded-[18px]"
          >
            Jobs
          </div>
        </div>
      </div>

      <Divider mb={10} />

      <div className="flex-1">
        {controlActive === "modules" ? (
          <EditModules />
        ) : (
          <DefinitionsController control={controlActive} />
        )}
      </div>
    </div>
  );
};

export default AdminController;
