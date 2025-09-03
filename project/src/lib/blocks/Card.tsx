// src/components/lib/Blocks/Card.tsx
import React from "react";
import clsx from "clsx";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-gray-200 bg-white shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardContent: React.FC<
  React.HTMLAttributes<HTMLDivElement>
> = ({ children, className, ...props }) => {
  return (
    <div className={clsx("p-4", className)} {...props}>
      {children}
    </div>
  );
};