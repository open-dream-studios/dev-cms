// project/src/modules/EstimationFormsModule/EstimationFormsModule.tsx
"use client";
import { HomeLayout } from "@/layouts/homeLayout";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import EstimationFormsSidebar from "./components/EstimationFormsSidebar";
import EstimationFormsBuilder from "./components/EstimationFormsBuilder";
import { useEstimationFormsUIStore } from "./_store/estimationForms.store";

const EstimationFormsModule = () => {
  const currentTheme = useCurrentTheme();
  const { estimationFormsLeftBarOpen } = useEstimationFormsUIStore();

  return (
    <HomeLayout
      left={estimationFormsLeftBarOpen ? <EstimationFormsSidebar mini={false}/> : <EstimationFormsSidebar mini={true}/>}
      fixedLeft={false}
    >
      <div
        className="w-full h-full pl-[5px] pr-[3px]"
        style={{
          background: `linear-gradient(180deg, ${currentTheme.background_1} 0%, ${currentTheme.background_1_2} 100%)`,
        }}
      >
        <EstimationFormsBuilder />
      </div>
    </HomeLayout>
  );
};

export default EstimationFormsModule;
