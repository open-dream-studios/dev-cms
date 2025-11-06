// project/src/lib/blocks/Divider.tsx
import { AuthContext } from "@/contexts/authContext";
import { useCurrentTheme } from "@/hooks/useTheme";
import { useContext } from "react";

const Divider = ({ width, mb }: { width?: string; mb?: number }) => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  if (!currentUser) return null;

  return (
    <div
      className="w-full h-[1px] flex justify-center"
      style={{ marginBottom: mb ? `${mb}px` : "none" }}
    >
      <div
        style={{
          backgroundColor: currentTheme.background_2,
          width,
        }}
        className="w-full h-[100%] rounded-[1px]"
      />
    </div>
  );
};

export default Divider;
