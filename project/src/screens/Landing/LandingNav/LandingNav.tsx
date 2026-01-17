// project/src/screens/landing/LandingNav/LandingNav.tsx
"use client"; 
import appDetails from "../../../util/appDetails.json";
import Login from "../Login/Login";
import { removeWhiteSpace } from "@/util/functions/Data";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useUiStore } from "@/store/useUIStore";

const LandingNav = () => {
  const currentTheme = useCurrentTheme();
  const {
    domain,
    leftBarOpen,
    setLeftBarOpen,
    leftBarRef,
    modal1,
    setModal1,
    landingImageLoaded,
  } = useUiStore();

  let landing_title = appDetails.default_title;
  let landing_logo = appDetails.default_logo;
  let app_color = appDetails.default_color;
  let nav_color = appDetails.default_landing_color;

  const foundProject = appDetails.projects.find(
    (item) => item.domain === domain
  );

  if (foundProject) {
    landing_title = foundProject.landing_title;
    landing_logo = foundProject.landing_logo;
    app_color = foundProject.app_color;
    nav_color = foundProject.landing_color;
  }

  const toggleLeftBar = () => {
    if (leftBarRef && leftBarRef.current) {
      leftBarRef.current.style.transition = "right 0.3s ease-in-out";
    }
    setLeftBarOpen(!leftBarOpen);
    setTimeout(() => {
      if (leftBarRef && leftBarRef.current) {
        leftBarRef.current.style.transition = "none";
      }
    }, 300);
  };

  const handleSignInClick = () => {
    setModal1({
      ...modal1,
      open: !modal1.open,
      showClose: true,
      width: "w-[100vw] sm:w-[90vw] h-[100vh] sm:h-[auto]",
      maxWidth: "max-w-[1000px] min-h-[655px] sm:min-h-[500px]",
      aspectRatio: "sm:aspect-[3/3.4] md:aspect-[5/4.5] lg:aspect-[5/3.9]",
      borderRadius: "rounded-0 sm:rounded-[15px] md:rounded-[20px]",
      content: <Login />,
    });
  };

  return (
    <div
      style={
        {
          "--nav-height": `${appDetails.nav_height}px`,
          "--left-bar-width": removeWhiteSpace(appDetails.left_bar_width),
          "--nav-ml": appDetails.left_bar_width,
          backgroundColor: nav_color,
          opacity: landingImageLoaded ? 1 : 0,
          transition: "opacity 200ms ease, background-color 200ms ease",
          pointerEvents: landingImageLoaded ? "auto" : "none",
        } as React.CSSProperties
      }
      className={`fixed z-[900] ${
        appDetails.left_bar_full
          ? "w-[100vw] lg:w-[calc(100vw-(var(--left-bar-width))] lg:ml-[calc(var(--nav-ml))]"
          : "w-[100vw]"
      } h-[var(--nav-height)]`}
    >
      <div className="w-[100%] h-[100%] absolute flex justify-between items-center">
        <div className="flex flex-row items-center px-[18px]">
          <div className="flex flex-row gap-[5px] items-center">
            <img
              src={landing_logo}
              alt="logo"
              className="select-none ml-[3px] mt-[-1px] w-[35px] h-[35px] object-cover"
            />
            <p
              className="dim select-none text-[23px] font-[700] ml-[2px] hover:brightness-75"
              style={{
                color: currentTheme.text_1,
              }}
            >
              {landing_title}
            </p>
          </div>
        </div>

        <div className="h-[100%] mr-[18px] pr-[2px] flex items-center">
          <div
            onClick={handleSignInClick}
            style={{
              backgroundColor: app_color,
            }}
            className="cursor-pointer select-none dim hover:brightness-75 px-[17px] py-[5.5px] text-[14px] font-[600] text-white/90 rounded-[7px]"
          >
            Sign in
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingNav;
