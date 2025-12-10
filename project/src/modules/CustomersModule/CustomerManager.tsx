// project/src/modules/CustomersModule/CustomerManager.tsx
import { useEffect } from "react";

import { Dashboard } from "@/components/Dashboard/Dashboard";
import { useDashboardStore } from "@/store/useDashboardStore";
import { DashboardLayout2 } from "@/components/Dashboard/presets/DashboardPreset2";
import { useContextQueries } from "@/contexts/queryContext/queryContext";

export default function CustomerManager() {
  const { projectCalls } = useContextQueries()
  const { setLayout, registerModules, updateSection, updateShape } = useDashboardStore();

  console.log(projectCalls)
   
  useEffect(() => {
    registerModules({
      layout2_t: null,
      layout2_m1: null,
      layout2_m2: null,
      layout2_m3: null,
      layout2_b: null,
    });
    setLayout(DashboardLayout2);
    updateSection("top", { fixedHeight: 46 }) 
    updateShape("top-shape", { bg: true }); 
  }, [registerModules, setLayout, updateSection, updateShape]);
  return <Dashboard minHeight={800} maxHeight={900} gap={0} />;
}
