// src/components/lib/Blocks/ScrollArea.tsx
import React from "react";
import clsx from "clsx";

export const ScrollArea: React.FC<
  React.HTMLAttributes<HTMLDivElement>
> = ({ className, children, ...props }) => {
  return (
    <div
      className={clsx("overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent", className)}
      {...props}
    >
      {children}
    </div>
  );
};