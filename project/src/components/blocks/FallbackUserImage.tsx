// project/src/components/blocks/FallbackUserImage.tsx
import { AuthContext } from "@/contexts/authContext";
import { useCurrentTheme } from "@/hooks/useTheme";
import React, { useContext } from "react";

const FallbackUserImage = () => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  if (!currentUser) return null;
  return (
    <div
      className="w-full h-full relative overflow-hidden rounded-full flex items-center justify-center"
      style={{
        backgroundColor: currentTheme.background_4,
      }}
    >
      <div className="bg-white w-[40%] h-[40%] absolute top-[25%] rounded-full"></div>
      <div className="bg-white w-[70%] h-[60%] absolute top-[71%] rounded-[50px]"></div>
    </div>
  );
};

export default FallbackUserImage;
