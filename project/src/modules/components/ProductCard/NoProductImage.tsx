import { AuthContext } from "@/contexts/authContext";
import { useCurrentTheme } from "@/hooks/useTheme";
import { useCurrentDataStore } from "@/store/currentDataStore";
import React, { useContext } from "react";

const NoProductImage = () => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { currentProject } = useCurrentDataStore();

  if (!currentUser) return null;
  return (
    <div
      className="w-[100%] h-full p-[15%]"
      style={{ backgroundColor: currentTheme.background_1_2 }}
    >
      {currentUser.theme === "light" &&
        currentProject &&
        currentProject.logo_light && (
          <img
            draggable={false}
            className="w-full h-full object-cover"
            src={currentProject.logo_light}
          />
        )}
      {currentUser.theme === "dark" &&
        currentProject &&
        currentProject.logo_dark && (
          <img
            draggable={false}
            className="w-full h-full object-cover"
            src={currentProject.logo_dark}
          />
        )}
    </div>
  );
};

export default NoProductImage;
