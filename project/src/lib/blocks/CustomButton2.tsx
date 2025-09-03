// src/components/lib/Blocks/CustomButton2.tsx
import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  size?: "sm" | "md" | "lg";
}

export const CustomButton2: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "default",
  size = "md",
  ...props
}) => {
  return (
    <button
      className={clsx(
        "rounded-xl font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1",
        {
          "bg-blue-600 text-white hover:bg-blue-700": variant === "default",
          "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50":
            variant === "outline",
        },
        {
          "px-2 py-1 text-sm": size === "sm",
          "px-4 py-2 text-base": size === "md",
          "px-6 py-3 text-lg": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};