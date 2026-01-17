// project/src/modules/_hooks/modules.hooks.ts
import { AuthContext } from "@/contexts/authContext";
import { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import {
  AccessibleModule,
  buildAccessibleModules,
  ICON_MAP,
} from "../_actions/modules.actions";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useUiStore } from "@/store/useUIStore";
import { useRouting } from "@/hooks/useRouting";
import { useUI } from "@/hooks/util/useUI";
import { Screen } from "@open-dream/shared";

export function useModules() {
  const { currentUser } = useContext(AuthContext);
  const { hasProjectModule } = useContextQueries();
  const { setLeftBarOpen, leftBarRef, pageLayoutRef } = useUiStore();
  const { screenClick } = useRouting();
  const { windowWidth } = useUI();

  const closeLeftBar = useCallback(() => {
    if (leftBarRef?.current) {
      leftBarRef.current.style.transition = "right 0.3s ease-in-out";
    }
    setLeftBarOpen(false);
    setTimeout(() => {
      if (leftBarRef?.current) {
        leftBarRef.current.style.transition = "none";
      }
    }, 300);
    if (pageLayoutRef?.current) {
      pageLayoutRef.current.style.transition =
        "width 0.3s ease-in-out, left 0.3s ease-in-out";
    }
    setTimeout(() => {
      if (pageLayoutRef?.current) {
        pageLayoutRef.current.style.transition = "none";
      }
    }, 300);
  }, []);

  const handleTabClick = useCallback(
    (tab: Screen) => {
      if (windowWidth && windowWidth < 1024) {
        closeLeftBar();
      }
      screenClick(tab, null);
    },
    [windowWidth, closeLeftBar, screenClick]
  );

  const clickableModules = useMemo(() => {
    const accessibleModules = buildAccessibleModules(
      hasProjectModule,
      currentUser
    );
    return accessibleModules.map((m: AccessibleModule) => ({
      ...m,
      icon: ICON_MAP[m.key],
      onClick: () => handleTabClick(m.key),
    }));
  }, [hasProjectModule, currentUser, handleTabClick]);

  const handleLogoClick = async () => {
    if (!clickableModules || !clickableModules.length) return;
    await handleTabClick(clickableModules[0].key);
  };

  const didAutoSelectRef = useRef(false);
  useEffect(() => {
    if (didAutoSelectRef.current) return;
    if (!clickableModules.length) return;
    didAutoSelectRef.current = true;
    handleTabClick(clickableModules[0].key);
  }, [clickableModules, handleTabClick]);

  return {
    handleTabClick,
    clickableModules,
    closeLeftBar,
    handleLogoClick,
  };
}
