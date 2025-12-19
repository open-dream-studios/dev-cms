// project/src/hooks/util/useTheme.tsx
import { useContext, useMemo } from "react";
import { AuthContext } from "@/contexts/authContext";
import { makeTheme } from "@/util/appTheme";
import appDetails from "@/util/appDetails.json";

export function useCurrentTheme() {
  const { currentUser } = useContext(AuthContext);
  const isDark = currentUser
    ? currentUser.theme === "dark"
    : appDetails.default_theme === "dark";
  return useMemo(() => makeTheme(isDark), [isDark]);
}
