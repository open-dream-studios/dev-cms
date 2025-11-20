"use client";
import SmoothSkeleton from "@/components/blocks/SmoothSkeleton";
import { useCurrentTheme } from "@/hooks/useTheme";
import { useLayoutStore } from "@/store/useLayoutStore";

export const EmptyComponent = () => {
  return <div className="w-[100%] h-[100%]"></div>;
};

export default function DashboardSkeleton() {
  const currentTheme = useCurrentTheme();
  const { modules, layout } = useLayoutStore();

  return (
    <div
      className="w-full px-[15px] py-[13px]"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
        gap: layout.gap,
        gridAutoRows: `${layout.rowHeight}px`,
      }}
    >
      {modules.map((mod) => {
        const Component = mod.component;

        return (
          <div
            key={mod.id}
            className={`rounded-2xl ${
              mod.overflowHidden ? "overflow-hidden" : ""
            }`}
            style={{
              gridColumn: `span ${mod.colSpan}`,
              gridRow: `span ${mod.rowSpan}`,
              backgroundColor: mod.bg ? currentTheme.card_bg_1 : "transparent",
            }}
          >
            {mod.loading ? (
              <SmoothSkeleton />
            ) : (
              <Component {...(mod.props ?? {})} />
            )}
          </div>
        );
      })}
    </div>
  );
}
