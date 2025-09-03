// src/components/lib/Blocks/TextArea.tsx
import React from "react";
import clsx from "clsx";

export const TextArea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={clsx(
      "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50",
      className
    )}
    {...props}
  />
));

TextArea.displayName = "Textarea";