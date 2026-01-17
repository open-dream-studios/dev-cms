// project/src/screens/Landing/LandingPage/LandingPage.tsx
"use client";
import appDetails from "../../../util/appDetails.json";
import { preloadImages } from "@/util/functions/Images";
import { useEffect } from "react";
import Image from "next/image";
import { useUiStore } from "@/store/useUIStore";
import { useUI } from "@/hooks/util/useUI";

const LandingPage = () => {
  const {
    domain, 
    setLandingImageLoaded,
  } = useUiStore();
  const { breakpoint } = useUI();

  let landing_hero_sm = appDetails.default_hero;
  let landing_hero_md = appDetails.default_hero;
  let landing_hero_lg = appDetails.default_hero;
  let landing_hero_style = appDetails.default_landing_hero_style
  const foundProject = appDetails.projects.find(
    (item) => item.domain === domain
  );
  if (foundProject) {
    landing_hero_sm = foundProject.landing_hero_sm;
    landing_hero_md = foundProject.landing_hero_md;
    landing_hero_lg = foundProject.landing_hero_lg;
    landing_hero_style = foundProject.landing_hero_style
  }

  useEffect(() => {
    const project = appDetails.projects.find((item) => item.domain === domain);
    const slides = project?.landing_slides ?? appDetails.default_slides;
    preloadImages(slides);

    if (foundProject) {
      const sizedHeros = [
        foundProject.landing_hero_sm,
        foundProject.landing_hero_md,
        foundProject.landing_hero_lg,
      ];
      preloadImages(sizedHeros);
    }
    setLandingImageLoaded(false);
  }, [domain]);

  const darken = foundProject ? foundProject.darken_landing : true;

  const heroSrc =
    breakpoint === "sm"
      ? landing_hero_sm
      : breakpoint === "md"
      ? landing_hero_md
      : landing_hero_lg;

  return (
    <div
      className="w-[100% display-height"
      style={{
        backgroundColor: foundProject
          ? foundProject.landing_color
          : appDetails.default_landing_color,
      }}
    >
      <div
        style={
          {
            "--nav-height": `${appDetails.nav_height}px`,
            "--left-bar-width": 0,
          } as React.CSSProperties
        }
        className={`absolute left-0 top-[var(--nav-height)] w-[100vw] flex h-[calc(100%-var(--nav-height))] overflow-scroll`}
      >
        <Image
          alt="hero"
          src={heroSrc}
          fill
          unoptimized
          priority
          className={`${landing_hero_style} 2xl:object-cover will-change-transform`}
          sizes="100vw"
          onLoadingComplete={() => setLandingImageLoaded(true)}
        />
        {darken && (
          <div className="absolute top-0 left-0 w-[100%] h-[100%] bg-black/50"></div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
