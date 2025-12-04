// project/src/components/DynamicTitle.tsx
"use client";
import { useEffect, useMemo } from "react";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { Media } from "@open-dream/shared";

export default function DynamicTitle() {
  const { currentProjectId } = useCurrentDataStore();
  const { projectsData, media } = useContextQueries();

  const currentProject = useMemo(() => {
    return projectsData.find((p) => p.id === currentProjectId) ?? null;
  }, [projectsData, currentProjectId]);

  const currentLogo = useMemo(() => {
    if (currentProject && currentProject.logo_media_id) {
      const foundMedia = media.find(
        (m: Media) => m.media_id === currentProject.logo_media_id
      );
      return foundMedia && foundMedia.url ? foundMedia.url : null;
    }
    return null;
  }, [currentProject, media]);

  useEffect(() => {
    if (currentProject) {
      document.title = `${currentProject.name}`;
    } else {
      document.title = "Project CMS";
    }

    const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (favicon) {
      favicon.href = currentLogo || "/favicon.ico";
    }
  }, [currentProject, currentLogo]);

  return null;
}
