"use client";
import { useContext, useMemo } from "react";
import { AuthContext } from "../../contexts/authContext";
import { HiBars3 } from "react-icons/hi2";
import { appTheme } from "../../util/appTheme";
import {
  useLeftBarOpenStore,
  useLeftBarRefStore,
} from "../../store/useLeftBarOpenStore";
import { useModal1Store } from "../../store/useModalStore";
import appDetails from "../../util/appDetails.json";
import { removeWhiteSpace } from "../../util/functions/Data";
import Link from "next/link";
import { usePageLayoutRefStore } from "@/store/usePageLayoutStore";
import { useAppContext } from "@/contexts/appContext";
import "./Navbar.css";
import { IoMdSettings } from "react-icons/io";
import Settings from "../Settings/Settings";
import { useContextQueries } from "@/contexts/queryContext";
import { useProjectContext } from "@/contexts/projectContext";
import { AiFillAppstore } from "react-icons/ai";
import { LuBlocks } from "react-icons/lu";
import EditModules from "@/screens/AdminHome/EditModules";
import UserImage from "../blocks/UserImage";

const Navbar = () => {
  const { currentUser } = useContext(AuthContext);
  const { currentProjectId, setCurrentProjectId } = useProjectContext();
  const { editingLock, pageClick } = useAppContext();
  const { projectsData } = useContextQueries();
  const modal1 = useModal1Store((state: any) => state.modal1);
  const setModal1 = useModal1Store((state: any) => state.setModal1);
  const leftBarOpen = useLeftBarOpenStore((state: any) => state.leftBarOpen);
  const setLeftBarOpen = useLeftBarOpenStore(
    (state: any) => state.setLeftBarOpen
  );
  const leftBarRef = useLeftBarRefStore((state) => state.leftBarRef);
  const pageLayoutRef = usePageLayoutRefStore((state) => state.pageLayoutRef);

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

  const handleClearProject = () => {
    setModal1({ ...modal1, open: false });
    setCurrentProjectId(null);
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
      content: <EditModules />,
    });
  };

  if (!currentUser) return null;

  return (
    <div
      style={
        {
          "--nav-height": `${appDetails.nav_height}px`,
          "--left-bar-width": removeWhiteSpace(appDetails.left_bar_width),
          "--nav-ml": appDetails.left_bar_width,
          backgroundColor: appTheme[currentUser.theme].background_1,
          borderBottom: `0.5px solid ${
            appTheme[currentUser.theme].background_2
          }`,
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
            color={appTheme[currentUser.theme].text_1}
            fontSize={29}
          />
          <div
            onClick={() => pageClick("/")}
            className="flex flex-row gap-[5px] items-center cursor-pointer dim hover:brightness-75 pr-[6px]"
          >
            <img
              src={
                currentProject && currentProject.logo !== null
                  ? currentProject.logo
                  : "https://res.cloudinary.com/dlzspcvgq/image/upload/v1755917022/logo2_euwj1f.png"
              }
              alt="logo"
              className={`${
                !currentProject
                  ? ""
                  : !leftBarOpen
                  ? "hidden"
                  : "hidden lg:block"
              }  select-none ml-[3px] mt-[-1px] w-[31px] h-[31px] object-cover`}
            />

            <div
              className="hidden [@media(min-width:450px)]:block select-none text-[23px] font-[700] ml-[10px]"
              style={{
                color: appTheme[currentUser.theme].text_1,
              }}
            >
              <p className="hidden sm:block">
                {currentProject ? currentProject.name : "Project CMS"}
              </p>
              <p className="block sm:hidden">
                {currentProject ? currentProject.short_name : "CMS"}
              </p>
            </div>
          </div>
        </div>

        <div className="h-[100%] mr-[12px] flex flex-row items-center gap-[12.5px]">
          {editingLock && (
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
                backgroundColor: appTheme[currentUser.theme].background_2,
              }}
            >
              <div className="flex items-center justify-center gap-[8px] mt-[-0.2px] flex-row h-[100%] overflow-hidden pr-[4px]">
                <LuBlocks
                  size={20}
                  color={appTheme[currentUser.theme].text_3}
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
                  backgroundColor: appTheme[currentUser.theme].background_2,
                }}
              >
                <div className="flex items-center justify-center gap-[8px] mt-[-0.2px] flex-row h-[100%] overflow-hidden pr-[4px]">
                  <AiFillAppstore
                    size={29}
                    color={appTheme[currentUser.theme].text_3}
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
                backgroundColor: appTheme[currentUser.theme].background_2,
              }}
            >
              <div className="flex items-center justify-center gap-[8px] mt-[-0.2px] flex-row h-[100%] overflow-hidden pr-[4px]">
                <IoMdSettings
                  size={19}
                  color={appTheme[currentUser.theme].text_1}
                  className="opacity-[60%]"
                />
                <div
                  className="truncate text-[14.5px] leading-[17px] font-[500] opacity-[87%]"
                  style={{
                    color: appTheme[currentUser.theme].text_1,
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
              backgroundColor: appTheme[currentUser.theme].background_2,
            }}
          >
            <div className="ml-[3px] mr-[5px] aspect-[1/1] h-[100%] p-[6px]">
              <UserImage />
            </div>
            <div className="flex flex-col justify-center mt-[0.5px] gap-[1px] flex-1 h-[100%] overflow-hidden pr-[4px]">
              <div
                className="truncate text-[14px] leading-[17px] font-[500]"
                style={{
                  color: appTheme[currentUser.theme].text_1,
                }}
              >
                {currentUser.first_name} {currentUser.last_name}
              </div>
              <div
                className="truncate text-[12px] leading-[15px] font-[200]"
                style={{
                  color: appTheme[currentUser.theme].text_2,
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
