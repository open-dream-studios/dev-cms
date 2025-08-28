import React, { useContext } from "react";
import { appTheme } from "../../util/appTheme";
import { AuthContext } from "@/contexts/authContext";

const NoUser = () => {
  const { currentUser } = useContext(AuthContext);
  if (!currentUser) return;

  return (
    <div
      className="w-full h-full relative overflow-hidden rounded-full flex items-center justify-center"
      style={{
        backgroundColor: appTheme[currentUser.theme].background_4,
      }}
    >
      <div
        style={{
          backgroundColor: appTheme[currentUser.theme].text_1,
        }}
        className="w-[40%] h-[40%] absolute top-[25%] rounded-full"
      ></div>
      <div
        style={{
          backgroundColor: appTheme[currentUser.theme].text_1,
        }}
        className="w-[70%] h-[60%] absolute top-[71%] rounded-[50px]"
      ></div>
    </div>
  );
};

export default NoUser;
