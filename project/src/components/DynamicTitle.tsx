// project/src/components/DynamicTitle.tsx
"use client";

import { useEffect } from "react";
import { useProjectContext } from "@/contexts/projectContext";
import { usePathname } from "next/navigation";

export default function DynamicTitle() {
  const { currentProject } = useProjectContext();
  const pathname = usePathname();

  useEffect(() => {
    if (currentProject) {
      document.title = `${currentProject.name}`;
    } else {
      document.title = "CMS";
    }

    const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (favicon) {
      favicon.href = currentProject?.logo || "/favicon.ico";
    }
  }, [currentProject, pathname]);  

  return null;
}