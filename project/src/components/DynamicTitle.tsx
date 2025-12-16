// project/src/components/DynamicTitle.tsx
"use client";
import { useContext, useEffect, useMemo } from "react";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { Media } from "@open-dream/shared"; 
import appDetails from "../util/appDetails.json";
import { AuthContext } from "@/contexts/authContext";
import { useUiStore } from "@/store/useUIStore";

export default function DynamicTitle() {
  const { currentProjectId } = useCurrentDataStore();
  const { projectsData, media } = useContextQueries();
  const { domain } = useUiStore();
  const { currentUser } = useContext(AuthContext)

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
    let landing_logo = appDetails.default_logo;
    let landing_title = appDetails.default_title;
    const foundProject = appDetails.projects.find(
      (item) => item.domain === domain
    );
    if (foundProject) {
      landing_logo = foundProject.landing_logo;
      landing_title = foundProject.landing_title
    }

    if (currentProject) {
      document.title = currentProject.name;
    } else {
      document.title = landing_title;
    }

    let favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");

    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }

    if (currentUser) {
      favicon.href = currentLogo || "./favicon.ico"
    } else {
      favicon.href = landing_logo;
    }
  }, [currentProject, currentLogo, currentUser, domain]);

  return null;
}
