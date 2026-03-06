// project/src/modules/EstimationFormsModule/EstimationFormRunsModule.tsx
// project/src/modules/EstimationFormsModule/EstimationFormRunsModule.tsx
"use client";

import { HomeLayout } from "@/layouts/homeLayout";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useEstimationFormRunsUIStore } from "./_store/estimationFormRuns.store";
import EstimationFormRunsSidebar from "./components/EstimationFormRunsSidebar";
import EstimationFormRunsRunner from "./components/EstimationFormRunsRunner";

const EstimationFormRunsModule = () => {
  const currentTheme = useCurrentTheme();
  const { estimationFormRunsLeftBarOpen } = useEstimationFormRunsUIStore();

  return (
    <HomeLayout
      left={
        estimationFormRunsLeftBarOpen ? (
          <EstimationFormRunsSidebar mini={false} />
        ) : (
          <EstimationFormRunsSidebar mini={true} />
        )
      }
      fixedLeft={false}
    >
      <div
        className="w-full h-full pl-[5px] pr-[3px] overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${currentTheme.background_1} 0%, ${currentTheme.background_1_2} 100%)`,
        }}
      >
        <EstimationFormRunsRunner />
      </div>
    </HomeLayout>
  );
};

export default EstimationFormRunsModule;
