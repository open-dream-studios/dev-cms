// project/src/components/Dashboard/ModuleSlot.tsx
import React from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { ModuleId } from "@/types/dashboard";

export const DashboardSlot: React.FC<{
  moduleId?: ModuleId | null;
  fallback?: React.ReactNode;
}> = ({ moduleId, fallback = null }) => {
  const modules = useDashboardStore((s) => s.modules);
  if (!moduleId) return <>{fallback}</>;
  const DashboardComponent = modules[moduleId];
  if (!DashboardComponent) return null;
  return <DashboardComponent />;
};
