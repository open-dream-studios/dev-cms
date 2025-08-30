import { AuthContext } from '@/contexts/authContext';
import { appTheme } from '@/util/appTheme';
import React, { ReactNode, useContext } from 'react'

interface CustomButtonProps {
  variant: "switch" | "outline" | "fill";
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
}

const CustomButton = ({ variant, onClick, children, active = true }: CustomButtonProps) => {
  const { currentUser } = useContext(AuthContext)
  if (!currentUser) return

  const outlineStyle = { bg: "transparent", color: appTheme[currentUser.theme].text_1, border: "1.5px solid" + appTheme[currentUser.theme].background_2 }
  const fillStyle = { bg: currentUser.theme === "light" ? "#10172A" : "#FFFFFF", color: appTheme[currentUser.theme].background_1, border: "1px solid" + currentUser.theme === "light" ? "#10172A" : "#FFFFFF" }

  const variantStyles: Record<
    NonNullable<CustomButtonProps["variant"]>,
    { bg: string; color: string, border: string; }
  > = {
    switch: active ? fillStyle : outlineStyle,
    outline: outlineStyle,
    fill: fillStyle
  };

  const { bg, color, border } = variantStyles[variant];

  return (
    <div
      style={{ backgroundColor: bg, color: color, border: border }}
      className="cursor-pointer hover:brightness-75 dim pl-[17px] pr-[18px] py-[7px] rounded-[8px] flex flex-row items-center justify-center gap-[8px]"
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export default CustomButton