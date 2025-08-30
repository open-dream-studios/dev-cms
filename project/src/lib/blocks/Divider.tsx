// project/src/lib/blocks/Divider.tsx
import { AuthContext } from "@/contexts/authContext";
import { appTheme } from "@/util/appTheme";
import { useContext } from "react";

const Divider = ({ width }: { width?: string }) => {
  const { currentUser } = useContext(AuthContext);
  if (!currentUser) return null;

  return (
    <div className="w-full h-[1px] flex justify-center mb-[10px]">
      <div
        style={{
          backgroundColor: appTheme[currentUser.theme].background_2,
          width,
        }}
        className="w-full h-[100%] rounded-[1px]"
      />
    </div>
  );
};

export default Divider