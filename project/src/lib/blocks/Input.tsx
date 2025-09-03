// src/components/lib/Blocks/Input.tsx
import React from "react";
import clsx from "clsx";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={clsx(
      "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50",
      className
    )}
    {...props}
  />
));

Input.displayName = "Input";