// project/src/layouts/homeLayout.tsx
import { ReactNode } from "react";

type HomeLayoutProps = {
  left?: ReactNode;
  top?: ReactNode;
  children: ReactNode;
};

export const homeLayoutLeftBarTopHeight = 59;
export const homeLayoutLeftBarWidth = 240;
export const homeLayoutTopBarHeight = 60;

export const HomeLayout = ({ left, top, children }: HomeLayoutProps) => {
  return (
    <div className="flex w-[100%] h-[100%] relative">
      {left && (
        <div
          className="shrink-0 h-[100%]"
          style={{ width: homeLayoutLeftBarWidth }}
        >
          {left}
        </div>
      )}
      <div className="flex flex-col flex-1 min-w-0">
        {top && (
          <div
            className="shrink-0 w-[100%]"
            style={{
              height: homeLayoutTopBarHeight,
            }}
          >
            {top}
          </div>
        )}
        <div className="flex-1 min-h-0">{children}</div>
      </div>
    </div>
  );
};
