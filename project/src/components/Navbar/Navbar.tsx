// project/src/components/Navbar/Navbar.tsx
"use client";
import { useContext, useMemo } from "react";
import { AuthContext } from "../../contexts/authContext";
import { HiBars3 } from "react-icons/hi2"; 
import appDetails from "../../util/appDetails.json";
import { removeWhiteSpace } from "../../util/functions/Data"; 
import "./Navbar.css";
import { IoMdSettings } from "react-icons/io";
import Settings from "../Settings/Settings";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { AiFillAppstore } from "react-icons/ai";
import { LuBlocks } from "react-icons/lu";
import UserImage from "../blocks/UserImage";
import AdminController from "@/screens/AdminHome/AdminControllers/AdminController";
import {
  setCurrentProjectData,
  useCurrentDataStore,
} from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { useRouting } from "@/hooks/useRouting";
import { useProductFormSubmit } from "@/hooks/forms/useProductForm";
import { useCurrentTheme } from "@/hooks/useTheme";
import { Media } from "@open-dream/shared";

const Navbar = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId } = useCurrentDataStore();
  const { screenClick } = useRouting();
  const { updatingLock } = useUiStore();
  const { projectsData, media } = useContextQueries();
  const { saveProducts } = useProductFormSubmit();
  const { leftBarOpen, setLeftBarOpen, leftBarRef, pageLayoutRef, modal1, setModal1 } = useUiStore(); 
  const currentTheme = useCurrentTheme();

  const currentProject = useMemo(() => {
    return projectsData.find((p) => p.id === currentProjectId) ?? null;
  }, [projectsData, currentProjectId]);

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

    if (pageLayoutRef && pageLayoutRef.current) {
      pageLayoutRef.current.style.transition =
        "width 0.3s ease-in-out, left 0.3s ease-in-out";
    }
    setTimeout(() => {
      if (pageLayoutRef && pageLayoutRef.current) {
        pageLayoutRef.current.style.transition = "none";
      }
    }, 300);
  };

  const handleProfileClick = () => {
    setModal1({
      ...modal1,
      open: !modal1.open,
      showClose: true,
      offClickClose: true,
      width: "w-[90vw] md:w-[80vw]",
      maxWidth: "md:max-w-[1000px]",
      aspectRatio: "aspect-[2/2.1] md:aspect-[3/2]",
      borderRadius: "rounded-[15px] md:rounded-[20px]",
      content: <Settings initialPage={"Account"} />,
    });
  };

  const handleSettingsClick = () => {
    setModal1({
      ...modal1,
      open: !modal1.open,
      showClose: true,
      offClickClose: true,
      width: "w-[90vw] md:w-[80vw]",
      maxWidth: "md:max-w-[1000px]",
      aspectRatio: "aspect-[2/2.1] md:aspect-[3/2]",
      borderRadius: "rounded-[15px] md:rounded-[20px]",
      content: <Settings initialPage={"Site"} />,
    });
  };

  const handleClearProject = async () => {
    await saveProducts();
    setModal1({ ...modal1, open: false });
    setCurrentProjectData(null);
  };

  const handleEditModulesClick = () => {
    setModal1({
      ...modal1,
      open: !modal1.open,
      showClose: true,
      offClickClose: true,
      width: "w-[90vw] md:w-[80vw]",
      maxWidth: "md:max-w-[1000px]",
      aspectRatio: "aspect-[2/2.1] md:aspect-[3/2]",
      borderRadius: "rounded-[15px] md:rounded-[20px]",
      content: <AdminController />,
    });
  };

  const handleLogoClick = () => {
    screenClick("dashboard", null);
  };

  const currentLogo = useMemo(() => {
    if (currentProject && currentProject.logo_media_id) {
      const foundMedia = media.find(
        (m: Media) => m.media_id === currentProject.logo_media_id
      );
      return foundMedia && foundMedia.url ? foundMedia.url : null;
    }
    return null;
  }, [currentProject, media]);

  if (!currentUser) return null;

  return (
    <div
      style={
        {
          "--nav-height": `${appDetails.nav_height}px`,
          "--left-bar-width": removeWhiteSpace(appDetails.left_bar_width),
          "--nav-ml": appDetails.left_bar_width,
          backgroundColor: currentTheme.background_1,
          borderBottom: `0.5px solid ${currentTheme.background_2}`,
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
          <HiBars3
            onClick={() => {
              toggleLeftBar();
            }}
            className={`w-[30px] dim cursor-pointer ${
              leftBarOpen && "lg:hidden"
            } ${!currentProject && "hidden"} hover:brightness-75 mx-[3px]`}
            color={currentTheme.text_1}
            fontSize={29}
          />
          <div
            onClick={handleLogoClick}
            className="flex flex-row gap-[5px] items-center cursor-pointer dim hover:brightness-75 pr-[6px]"
          >
            <img
              src={currentLogo ? currentLogo : appDetails.default_logo}
              alt="logo"
              className={`${
                !currentProject
                  ? ""
                  : !leftBarOpen
                  ? "hidden"
                  : "hidden lg:block"
              }  select-none ml-[3px] mt-[-1px] w-[31px] h-[31px] object-cover rounded-[5px]`}
            />

            <div
              className="hidden [@media(min-width:450px)]:block select-none text-[23px] font-[700] ml-[10px]"
              style={{
                color: currentTheme.text_1,
              }}
            >
              <p className="hidden sm:block">
                {currentProject ? currentProject.short_name : "Project CMS"}
              </p>
              <p className="block sm:hidden">
                {currentProject ? currentProject.short_name : "CMS"}
              </p>
            </div>
          </div>
        </div>

        <div className="h-[100%] mr-[12px] flex flex-row items-center gap-[12.5px]">
          {updatingLock && (
            <div
              style={{
                opacity: currentUser.theme === "dark" ? 0.1 : 0.7,
                border:
                  currentUser.theme === "light"
                    ? "2px solid #dddddd"
                    : "2px solid #555",
                borderTop:
                  currentUser.theme === "light"
                    ? `2px solid #bbbbbb`
                    : "2px solid #dddddd",
              }}
              className="w-[28px] h-[28px] mt-[3px] simple-spinner"
            ></div>
          )}

          {currentUser.admin === 1 && (
            <div
              onClick={handleEditModulesClick}
              className="opacity-[92%] dim cursor-pointer flex flex-row w-fit max-w-[250px] px-[15px] h-[42px] hover:brightness-75 rounded-[4.5px]"
              style={{
                backgroundColor: currentTheme.background_2,
              }}
            >
              <div className="flex items-center justify-center gap-[8px] mt-[-0.2px] flex-row h-[100%] overflow-hidden pr-[4px]">
                <LuBlocks
                  size={20}
                  color={currentTheme.text_3}
                  className="opacity-[60%]"
                />
              </div>
            </div>
          )}

          {currentProject !== null &&
            (projectsData.length > 1 || currentUser.admin === 1) && (
              <div
                onClick={handleClearProject}
                className="opacity-[92%] dim cursor-pointer flex flex-row w-fit max-w-[250px] px-[15px] h-[42px] hover:brightness-75 rounded-[4.5px]"
                style={{
                  backgroundColor: currentTheme.background_2,
                }}
              >
                <div className="flex items-center justify-center gap-[8px] mt-[-0.2px] flex-row h-[100%] overflow-hidden pr-[4px]">
                  <AiFillAppstore
                    size={24}
                    color={currentTheme.text_3}
                    className="opacity-[60%]"
                  />
                </div>
              </div>
            )}

          {currentProject !== null && projectsData.length >= 1 && (
            <div
              onClick={handleSettingsClick}
              className="opacity-[92%] dim cursor-pointer flex flex-row w-fit max-w-[250px] px-[15px] h-[42px] hover:brightness-75 rounded-[4.5px]"
              style={{
                backgroundColor: currentTheme.background_2,
              }}
            >
              <div className="flex items-center justify-center gap-[8px] mt-[-0.2px] flex-row h-[100%] overflow-hidden pr-[4px]">
                <IoMdSettings
                  size={19}
                  color={currentTheme.text_1}
                  className="opacity-[60%]"
                />
                <div
                  className="select-none truncate text-[14.5px] leading-[17px] font-[500] opacity-[87%]"
                  style={{
                    color: currentTheme.text_1,
                  }}
                >
                  Settings
                </div>
              </div>
            </div>
          )}

          <div
            onClick={handleProfileClick}
            className="dim cursor-pointer flex flex-row w-fit max-w-[250px] pr-[10px] h-[42px] hover:brightness-75 rounded-[4.5px]"
            style={{
              backgroundColor: currentTheme.background_2,
            }}
          >
            <div className="ml-[3px] mr-[5px] aspect-[1/1] h-[100%] p-[6px]">
              <UserImage />
            </div>
            <div className="flex flex-col justify-center mt-[0.5px] gap-[1px] flex-1 h-[100%] overflow-hidden pr-[4px]">
              <div
                className="truncate text-[14px] leading-[17px] font-[500]"
                style={{
                  color: currentTheme.text_1,
                }}
              >
                {currentUser.first_name} {currentUser.last_name}
              </div>
              <div
                className="truncate text-[12px] leading-[15px] font-[200]"
                style={{
                  color: currentTheme.text_2,
                }}
              >
                {currentUser.email}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
