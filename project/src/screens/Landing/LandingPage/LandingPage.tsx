"use client";
import appDetails from "../../../util/appDetails.json";

const LandingPage = () => {
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
          src="https://res.cloudinary.com/dlzspcvgq/image/upload/v1755910905/login_mthap6.jpg"
          alt="logo"
          className="select-none w-[100vw] object-contain"
        />
      </div>
    </div>
  );
};

export default LandingPage;
