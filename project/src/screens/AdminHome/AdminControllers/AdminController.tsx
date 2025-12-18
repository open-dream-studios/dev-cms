// project/src/screens/AdminHome/AdminControllers/AdminController.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import React, { useContext, useState } from "react";
import EditModules from "./EditModules";
import Divider from "@/lib/blocks/Divider";
import EditPageDefinitions from "./EditPageDefinitions";
import EditSectionDefinitions from "./EditSectionDefinitions";
import { useCurrentTheme } from "@/hooks/util/useTheme";

export type Control = "modules" | "pages" | "sections";

const AdminController = () => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();

  const [controlActive, setControlActive] = useState<Control>("modules");

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
          className="flex w-[290px] pl-1 h-8 rounded-[18px] flex-row items-center"
        >
          <div
            onClick={() => setControlActive("modules")}
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
            onClick={() => setControlActive("pages")}
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
            onClick={() => setControlActive("sections")}
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
        </div>
      </div>

      <Divider mb={10} />

      <div className="flex-1">
        {controlActive === "modules" && <EditModules />}
        {controlActive === "pages" && <EditPageDefinitions />}
        {controlActive === "sections" && <EditSectionDefinitions />}
      </div>
    </div>
  );
};

export default AdminController;
