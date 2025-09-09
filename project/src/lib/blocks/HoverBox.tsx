import { MouseEventHandler, ReactNode, useContext, useState } from "react";
import { motion } from "framer-motion";
import { AuthContext } from "@/contexts/authContext";
import { appTheme } from "@/util/appTheme";
import { useAppContext } from "@/contexts/appContext";
import { Screen } from "@/types/screens";

type HoverBoxProps = {
  children: ReactNode;
  pages: Screen[];
  onClick?: MouseEventHandler<HTMLDivElement>;
};

const HoverBox = ({ children, onClick, pages }: HoverBoxProps) => {
  const { currentUser } = useContext(AuthContext);
  const { screen } = useAppContext();
  const [hovered, setHovered] = useState(false);

  if (!currentUser) return null;

  return (
    <motion.div
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{
        backgroundColor: hovered
          ? appTheme[currentUser.theme].background_2
          : pages.includes(screen)
            ? appTheme[currentUser.theme].background_2
            : appTheme[currentUser.theme].background_1,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="cursor-pointer rounded-[8px] w-full h-[38px] flex items-center justify-start px-[12px]"
    >
      {children}
    </motion.div>
  );
};

export default HoverBox;