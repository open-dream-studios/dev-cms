import { AuthContext } from "@/contexts/authContext";
import { useCurrentTheme } from "@/hooks/useTheme";
import React, { useContext } from "react";

const NoProductImage = () => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  if (!currentUser) return null;
  return (
    <div
      className="w-[100%] h-[100%] p-[15%]"
      style={{ backgroundColor: currentTheme.background_1_2 }}
    >
      <img
        draggable={false}
        className="w-full h-full object-cover"
        src={
          currentUser.theme === "light"
            ? "https://dev-cms-project-media.s3.us-east-1.amazonaws.com/prod%2FPROJ-90959de1e1d%2F7bbe59f8-f78d-4a9c-91e9-4468d38dcb0e.webp"
            : "https://dev-cms-project-media.s3.us-east-1.amazonaws.com/prod/PROJ-90959de1e1d/85223ee8-409d-47d8-a0cd-4b071edebf87.webp"
        }
      />
    </div>
  );
};

export default NoProductImage;
