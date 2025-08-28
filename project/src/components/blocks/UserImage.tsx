import React, { useContext, useState } from "react";
import { AuthContext } from "@/contexts/authContext";
import { appTheme } from "@/util/appTheme";

const UserImage = () => {
  const { currentUser } = useContext(AuthContext);
  const [imgError, setImgError] = useState(false);

  if (!currentUser) return null;

  const fallback = (
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

  if (!currentUser.profile_img_src || imgError) {
    return fallback;
  }

  return (
    <img
      className="w-full h-full rounded-full"
      src={currentUser.profile_img_src}
      onError={() => setImgError(true)}
    />
  );
};

export default UserImage;
