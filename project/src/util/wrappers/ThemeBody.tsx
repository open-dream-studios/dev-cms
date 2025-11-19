// ThemeBody.tsx
"use client";
import { useCurrentTheme } from "@/hooks/useTheme";

export default function ThemeBody({ children }: any) {
  const theme = useCurrentTheme();
  return (
    <body style={{ backgroundColor: theme.background_1 }}>
      {children}
    </body>
  );
}