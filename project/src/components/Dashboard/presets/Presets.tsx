// project/src/components/Dashboard/presets/Presets.tsx
import { LayoutRenderer } from "@/types/dashboard";
import { LeftTwoThirdRightStacked } from "./DashboardPreset2";
import { FullLayout } from "./DashboardPreset1";

// Registry
export const DashboardLayoutRegistry: Record<string, LayoutRenderer> = {
  "full": FullLayout,
  "left-2/3-right-stacked": LeftTwoThirdRightStacked,
};
