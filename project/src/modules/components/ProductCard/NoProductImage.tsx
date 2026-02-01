// project/src/modules/components/ProductCard/NoProductImage.tsx
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { Media } from "@open-dream/shared";
import React, { useContext, useMemo } from "react";

const NoProductImage = () => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { media } = useContextQueries();
  const { currentProject } = useCurrentDataStore();

  const currentLightLogo = useMemo(() => {
    if (currentProject && currentProject.logo_light_media_id) {
      const foundMedia = media.find(
        (m: Media) => m.media_id === currentProject.logo_light_media_id
      );
      return foundMedia && foundMedia.url ? foundMedia.url : null;
    }
    return null;
  }, [currentProject, media]);

  const currentDarkLogo = useMemo(() => {
    if (currentProject && currentProject.logo_dark_media_id) {
      const foundMedia = media.find(
        (m: Media) => m.media_id === currentProject.logo_dark_media_id
      );
      return foundMedia && foundMedia.url ? foundMedia.url : null;
    }
    return null;
  }, [currentProject, media]);

  if (!currentUser) return null;
  return (
    <div
      className="w-[100%] h-full p-[15%]"
      style={{ backgroundColor: currentTheme.background_1_3 }}
    >
      {currentUser.theme === "light" && currentLightLogo && (
        <img
          draggable={false}
          className="w-full h-full object-cover"
          src={currentLightLogo}
        />
      )}
      {currentUser.theme === "dark" && currentDarkLogo && (
        <img
          draggable={false}
          className="w-full h-full object-cover"
          src={currentDarkLogo}
        />
      )}
    </div>
  );
};

export default NoProductImage;
