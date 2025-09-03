import React, { useContext, useState } from "react";
import { AuthContext } from "@/contexts/authContext";
import { appTheme } from "@/util/appTheme";
import FallbackUserImage from "./FallbackUserImage";

const UserImage = () => {
  const { currentUser } = useContext(AuthContext);
  const [imgError, setImgError] = useState(false);

  if (!currentUser) return null;

  if (!currentUser.profile_img_src || imgError) {
    return <FallbackUserImage />;
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
