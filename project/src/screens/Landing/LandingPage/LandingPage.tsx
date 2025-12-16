// project/src/screens/Landing/LandingPage/LandingPage.tsx
"use client"; 
import appDetails from "../../../util/appDetails.json";
import { useUiStore } from "@/store/useUIStore";

const LandingPage = () => {
  const { domain } = useUiStore();
  let landing_hero = appDetails.default_hero;
  const foundProject = appDetails.projects.find(
    (item) => item.domain === domain
  );
  if (foundProject) {
    landing_hero = foundProject.landing_hero;
  }

  return (
    <div className="w-[100% display-height bg-black">
      <div
        style={
          {
            "--nav-height": `${appDetails.nav_height}px`,
            "--left-bar-width": 0,
          } as React.CSSProperties
        }
        className={`absolute left-0 top-[var(--nav-height)] w-[100vw] flex h-[calc(100%-var(--nav-height))] overflow-scroll`}
      >
        <img
          src={landing_hero}
          alt="logo"
          className={`select-none w-[100vw] ${
            foundProject ? "object-cover" : "object-contain"
          }`}
        />
        <div className="absolute top-0 left-0 w-[100%] h-[100%] bg-black/50"></div>
      </div>
    </div>
  );
};

export default LandingPage;
