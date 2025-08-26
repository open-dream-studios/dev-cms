// project/src/components/DynamicTitle.tsx
"use client";

import { useEffect } from "react";
import { useAppContext } from "@/contexts/appContext";

export default function DynamicTitle() {
  const { currentProject } = useAppContext();

  useEffect(() => {
    if (currentProject) {
      document.title = `${currentProject.name}`;
    } else {
      document.title = "CMS";
    }

    const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (favicon) {
      if (currentProject?.logo) {
        favicon.href = currentProject.logo;
        console.log(currentProject.logo)
      } else {
        favicon.href = "/favicon.ico";
      }
    }
  }, [currentProject]);

  return null;
}
