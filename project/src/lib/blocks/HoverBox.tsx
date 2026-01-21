import { MouseEventHandler, ReactNode, useContext, useState } from "react";
import { motion } from "framer-motion";
import { AuthContext } from "@/contexts/authContext";
import { Screen } from "@open-dream/shared";
import { useUiStore } from "@/store/useUIStore";
import { useCurrentTheme } from "@/hooks/util/useTheme";

type HoverBoxProps = {
  children: ReactNode;
  pages: Screen[];
  onClick?: MouseEventHandler<HTMLDivElement>;
};

const HoverBox = ({ children, onClick, pages }: HoverBoxProps) => {
  const { currentUser } = useContext(AuthContext);
  const { screen } = useUiStore();
  const currentTheme = useCurrentTheme();

  const [hovered, setHovered] = useState(false);

  if (!currentUser) return null;

  return (
    <motion.div
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{
        backgroundColor: hovered
          ? currentTheme.background_2
          : pages.includes(screen)
          ? currentTheme.background_2
          : currentTheme.background_1,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="select-none cursor-pointer rounded-[8px] w-full h-[38px] flex items-center justify-start px-[12px]"
    >
      {children}
    </motion.div>
  );
};

export default HoverBox;
