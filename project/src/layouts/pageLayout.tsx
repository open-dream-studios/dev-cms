// project/src/layouts/pageLayout.tsx
"use client";
import { ReactNode, RefObject, useContext, useEffect, useRef } from "react";
import { AuthContext } from "@/contexts/authContext";
import { appTheme } from "@/util/appTheme";
import appDetails from "@/util/appDetails.json";
import { useLeftBarOpenStore } from "@/store/useLeftBarOpenStore";
import { usePageLayoutRefStore } from "@/store/usePageLayoutStore";

export const PageLayout = ({
  children,
  leftbar,
}: {
  children: ReactNode;
  leftbar: boolean;
}) => {
  const { currentUser } = useContext(AuthContext);
  const leftBarOpen = useLeftBarOpenStore((state: any) => state.leftBarOpen);

  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];

  const pageLayoutRef = useRef<HTMLDivElement>(null);
  const setPageLayoutRef = usePageLayoutRefStore(
    (state) => state.setPageLayoutRef
  );

  useEffect(() => {
    setPageLayoutRef(pageLayoutRef as RefObject<HTMLDivElement>);
  }, [setPageLayoutRef, pageLayoutRef]);

  if (!currentUser) return null;

  if (leftbar)
    return (
      <div
        ref={pageLayoutRef}
        style={
          {
            "--nav-height": `${appDetails.nav_height}px`,
            "--left-bar-width": appDetails.left_bar_width,
            backgroundColor: t.background_1,
            color: t.text_1,
          } as React.CSSProperties
        }
        className={`absolute left-0 ${
          leftBarOpen && "lg:left-[calc(var(--left-bar-width))]"
        } top-[var(--nav-height)] w-[100vw] ${
          leftBarOpen && "lg:w-[calc(100vw-(var(--left-bar-width)))]"
        } flex h-[calc(100%-var(--nav-height))]`}
      >
        <div className="relative w-[100%] h-[100%]">{children}</div>
      </div>
    );

  return (
    <div
      style={
        {
          "--nav-height": `${appDetails.nav_height}px`,
          backgroundColor: t.background_1,
          color: t.text_1,
        } as React.CSSProperties
      }
      className={`absolute left-0  top-[var(--nav-height)] w-[100vw] flex h-[calc(100%-var(--nav-height))]`}
    >
      <div className="relative w-[100%] h-[100%]">{children}</div>
    </div>
  );
};
