// project/src/modules/EstimationFormsModule/EstimationFormsModule.tsx
"use client";
import { HomeLayout } from "@/layouts/homeLayout";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import EstimationFormsSidebar from "./components/EstimationFormsSidebar";
import EstimationFormsBuilder from "./components/EstimationFormsBuilder";

const EstimationFormsModule = () => {
  const currentTheme = useCurrentTheme();

  return (
    <HomeLayout left={<EstimationFormsSidebar />}>
      <div
        className="w-full h-full"
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
