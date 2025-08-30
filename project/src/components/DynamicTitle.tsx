// project/src/components/DynamicTitle.tsx
"use client";

import { useEffect, useMemo } from "react";
import { useProjectContext } from "@/contexts/projectContext";
import { usePathname } from "next/navigation";
import { useContextQueries } from "@/contexts/queryContext/queryContext";

export default function DynamicTitle() {
  const { currentProjectId } = useProjectContext();
  const { projectsData } = useContextQueries();
  const pathname = usePathname();

  const currentProject = useMemo(() => {
    return projectsData.find((p) => p.id === currentProjectId) ?? null;
  }, [projectsData, currentProjectId]);

  useEffect(() => {
    if (currentProject) {
      document.title = `${currentProject.name}`;
    } else {
      document.title = "Project CMS";
    }

    const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (favicon) {
      favicon.href = currentProject?.logo || "/favicon.ico";
    }
  }, [currentProject, pathname]);

  return null;
}
