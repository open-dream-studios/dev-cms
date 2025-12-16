// project/src/components/LeftBar/LeftBar.tsx
"use client";
import {
  useEffect,
  RefObject,
  useRef,
  useState,
  useContext,
  useMemo,
  ReactNode,
} from "react";
import { useModal2Store } from "../../store/useModalStore";
import Modal2Continue from "../../modals/Modal2Continue";
import appDetails from "../../util/appDetails.json";
import { AuthContext } from "@/contexts/authContext";
import { LuPanelLeftClose } from "react-icons/lu";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { HiServer, HiViewBoards } from "react-icons/hi";
import { FaImages } from "react-icons/fa";
import ProductsDataIcon from "@/lib/icons/ProductsDataIcon";
import Divider from "@/lib/blocks/Divider";
import { FaPollH } from "react-icons/fa";
import HoverBox from "@/lib/blocks/HoverBox";
import { IoPersonSharp } from "react-icons/io5";
import { Media, Screen } from "@open-dream/shared";
import { BsFillPersonVcardFill } from "react-icons/bs";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useRouting } from "@/hooks/useRouting";
import { useCurrentTheme } from "@/hooks/useTheme";
import { IoMdMail } from "react-icons/io";
import { useUiStore } from "@/store/useUIStore";

type BoxItem = {
  title: string;
  icon: ReactNode;
  pages: Screen[];
  onClick: () => void;
};

type BoxSectionProps = {
  items: BoxItem[];
};

const BoxSection: React.FC<BoxSectionProps> = ({ items }) => {
  return (
    <div className="w-[100%] flex flex-col mb-[10px]">
      <Divider mb={10} />
      <div className="flex flex-col gap-[9px]">
        {items.map((item: BoxItem, index: number) => (
          <HoverBox key={index} onClick={item.onClick} pages={item.pages}>
            <div className="select-none flex flex-row gap-[8px]">
              {item.icon}
              <p className="brightness-[55%] text-[15.6px] leading-[18px] font-[400]">
                {item.title}
              </p>
            </div>
          </HoverBox>
        ))}
      </div>
    </div>
  );
};

const LeftBar = () => {
  const { currentUser, handleLogout } = useContext(AuthContext);
  const { currentProjectId } = useCurrentDataStore();
  const { hasProjectModule, projectsData, media } = useContextQueries();
  const { screenClick } = useRouting();
  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);
  const {
    leftBarOpen,
    setLeftBarOpen,
    leftBarRef,
    setLeftBarRef,
    pageLayoutRef,
  } = useUiStore();
  const [showLeftBar, setShowLeftBar] = useState<boolean>(false);
  const showLeftBarRef = useRef<HTMLDivElement>(null);
  const windowLargeRef = useRef<boolean>(window.innerWidth > 1024);
  const [windowWidth, setWindowWidth] = useState<number | null>(null);
  const currentTheme = useCurrentTheme();

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
    setLeftBarRef(leftBarRef as RefObject<HTMLDivElement>);
  }, [setLeftBarRef, leftBarRef]);

  // Global State -> Set local state -> Trigger fade in
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (leftBarOpen) {
      setShowLeftBar(true);
    } else {
      if (showLeftBarRef.current) {
        showLeftBarRef.current.style.opacity = "0";
        showLeftBarRef.current.style.backgroundColor = "transparent";
      }
      timeout = setTimeout(() => {
        setShowLeftBar(false);
      }, 500);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [leftBarOpen]);

  // Local State -> Trigger fade out
  useEffect(() => {
    if (showLeftBar) {
      requestAnimationFrame(() => {
        if (showLeftBarRef.current) {
          showLeftBarRef.current.style.opacity = "1";
          showLeftBarRef.current.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        }
      });
    }
  }, [showLeftBar]);

  const closeLeftBar = () => {
    if (leftBarRef && leftBarRef.current) {
      leftBarRef.current.style.transition = "right 0.3s ease-in-out";
    }
    setLeftBarOpen(false);
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

  const leftBarOpenRef = useRef(leftBarOpen);
  useEffect(() => {
    leftBarOpenRef.current = leftBarOpen;
  }, [leftBarOpen]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > 1024 && !windowLargeRef.current) {
        windowLargeRef.current = true;
        setLeftBarOpen(true);
      }
      if (window.innerWidth < 1024 && windowLargeRef.current) {
        windowLargeRef.current = false;
        setLeftBarOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setLeftBarOpen]);
  if (windowWidth === null) return null;

  const offsetHeight =
    appDetails.left_bar_full || windowWidth < 1024 ? 0 : appDetails.nav_height;

  const handleSignOut = () => {
    if (!currentUser) return null;
    setModal2({
      ...modal2,
      open: !modal2.open,
      showClose: false,
      offClickClose: true,
      width: "w-[300px]",
      maxWidth: "max-w-[400px]",
      aspectRatio: "aspect-[5/2]",
      borderRadius: "rounded-[12px] md:rounded-[15px]",
      content: (
        <Modal2Continue
          text={
            "Sign out as " +
            currentUser.first_name +
            " " +
            currentUser.last_name +
            "?"
          }
          onContinue={handleLogout}
          threeOptions={false}
        />
      ),
    });
  };

  const handleTabClick = (tab: Screen) => {
    if (windowWidth && windowWidth < 1024) {
      closeLeftBar();
    }
    screenClick(tab, null);
  };

  if (!currentUser) return null;

  const renderModule = (item: BoxItem, withClose: boolean = false) => {
    return (
      <div className="w-[100%] flex flex-row-reverse justify-end items-center mb-[11px]">
        {withClose && (
          <LuPanelLeftClose
            style={{ color: currentTheme.text_4 }}
            className="hidden lg:block dim cursor-pointer brightness-75 hover:brightness-50 w-[24px] h-[24px] mr-[-8px] ml-[10px]"
            onClick={closeLeftBar}
          />
        )}
        <div className="flex-1 flex flex-col">
          <HoverBox onClick={item.onClick} pages={item.pages}>
            <div className="flex flex-row gap-[8px]">
              {item.icon}
              <p className="brightness-[55%] text-[15.6px] leading-[18px] font-[400]">
                {item.title}
              </p>
            </div>
          </HoverBox>
        </div>
      </div>
    );
  };

  // Gather all available modules in order
  const displayedModules: BoxItem[] = [];

  if (hasProjectModule("google-ads-api-module")) {
    displayedModules.push({
      title: "Dashboard",
      icon: (
        <HiServer
          size={15}
          color={currentTheme.text_3}
          className="w-[17px] h-[17px] brightness-75"
        />
      ),
      pages: ["google-ads" as Screen],
      onClick: () => handleTabClick("google-ads"),
    });
  }

  if (hasProjectModule("customer-products-module")) {
    displayedModules.push({
      title: "Inventory",
      icon: <HiViewBoards className="w-[17px] h-[17px] brightness-75" />,
      pages: ["customer-products" as Screen, "edit-customer-product" as Screen],
      onClick: () => handleTabClick("customer-products"),
    });
  }

  if (hasProjectModule("customers-module")) {
    displayedModules.push({
      title: "Customers",
      icon: <IoPersonSharp className="brightness-75 mt-[1px]" size={16} />,
      pages: ["customers" as Screen],
      onClick: () => handleTabClick("customers"),
    });
  }

  if (hasProjectModule("google-gmail-module")) {
    displayedModules.push({
      title: "Gmail",
      icon: <IoMdMail className="brightness-75 mt-[-1.25px]" size={18} />,
      pages: ["gmail" as Screen],
      onClick: () => handleTabClick("gmail"),
    });
  }

  if (hasProjectModule("pages-module")) {
    displayedModules.push({
      title: "Website",
      icon: <FaPollH className="brightness-75 mt-[1px]" size={16} />,
      pages: ["pages" as Screen],
      onClick: () => handleTabClick("pages"),
    });
  }

  if (
    hasProjectModule("media-module") &&
    hasProjectModule("global-media-module")
  ) {
    displayedModules.push({
      title: "Media",
      icon: <FaImages className="w-[17px] h-[17px] brightness-75" />,
      pages: ["media" as Screen],
      onClick: () => handleTabClick("media"),
    });
  }

  if (hasProjectModule("products-module")) {
    displayedModules.push(
      {
        title: "Products",
        icon: <HiViewBoards className="w-[17px] h-[17px] brightness-75" />,
        pages: ["products" as Screen],
        onClick: () => handleTabClick("products"),
      },
      {
        title: "Data",
        icon: (
          <div
            className={`${
              currentUser.theme === "dark" ? "opacity-[70%]" : "opacity-[80%]"
            } mt-[2.85px]`}
          >
            <ProductsDataIcon size={22} />
          </div>
        ),
        pages: ["products-table" as Screen],
        onClick: () => handleTabClick("products-table"),
      }
    );
  }

  if (hasProjectModule("employees-module")) {
    displayedModules.push({
      title: "Employees",
      icon: (
        <div
          className={`${
            currentUser.theme === "dark" ? "opacity-[65%]" : "opacity-[80%]"
          } mt-[-1.8px] mr-[2px]`}
        >
          <BsFillPersonVcardFill size={20} />
        </div>
      ),
      pages: ["employees" as Screen],
      onClick: () => handleTabClick("employees"),
    });
  }

  if (hasProjectModule("tasks-module")) {
    displayedModules.push({
      title: "Tasks",
      icon: (
        <div
          className={`${
            currentUser.theme === "dark" ? "opacity-[65%]" : "opacity-[80%]"
          } mt-[2.85px]`}
        >
          <ProductsDataIcon size={22} />
        </div>
      ),
      pages: ["tasks" as Screen],
      onClick: () => handleTabClick("tasks"),
    });
  }

  return (
    <div className="display-height">
      <div
        style={
          {
            "--left-bar-width": appDetails.left_bar_width,
            "--offset-height": `${offsetHeight}px`,
            top: `${offsetHeight}px`,
          } as React.CSSProperties
        }
        className="z-[921] pointer-events-none w-[calc(var(--left-bar-width))] h-[calc(100%-var(--offset-height))] left-0 fixed"
      >
        <div
          ref={leftBarRef}
          style={{
            backgroundColor: currentTheme.background_1,
            borderRight: `0.5px solid ${currentTheme.background_2}`,
          }}
          className={`z-[951] pointer-events-auto ${
            leftBarOpen ? "right-0" : "right-[100%]"
          } absolute top-0 h-[100%] w-[100%] flex justify-center
          `}
        >
          <div
            style={{
              color: currentTheme.text_1,
            }}
            className="relative w-[100%] h-[100%] px-[20px] pt-[8.8px] items-start flex flex-col"
          >
            <div
              onClick={() => handleTabClick("dashboard")}
              className="flex lg:hidden flex-row mt-[22px] gap-[5px] mb-[18px] items-center cursor-pointer dim hover:brightness-75 pr-[6px]"
            >
              <img
                src={currentLogo ? currentLogo : appDetails.default_logo}
                alt="logo"
                className={`select-none ml-[3px] mt-[-1px] w-[31px] h-[31px] object-cover`}
              />

              <p
                className="select-none text-[23px] font-[700] ml-[8px] mt-[1px]"
                style={{
                  color: currentTheme.text_1,
                }}
              >
                {currentProject ? currentProject.short_name : "CMS"}
              </p>
            </div>

            <div className="w-[100%] flex flex-row-reverse justify-end items-center mt-[2px]">
              {displayedModules.length > 0 &&
                renderModule(displayedModules[0], true)}
            </div>

            {displayedModules.slice(1).map((m, i) => (
              <BoxSection key={i} items={[m]} />
            ))}
          </div>

          <div
            onClick={async () => {
              await screenClick("updates", null);
            }}
            className="dim select-none cursor-pointer w-[80%] hover:brightness-75 h-[40px] absolute bottom-[70px] flex items-center justify-center font-[600]"
            style={{
              borderRadius: "6px",
              border: "1px solid " + currentTheme.text_4,
              color: currentTheme.text_2,
              opacity: 0.75,
            }}
          >
            Updates
          </div>

          <div
            onClick={handleSignOut}
            className="dim select-none cursor-pointer w-[80%] hover:brightness-75 h-[40px] absolute bottom-[20px] flex items-center justify-center font-[600]"
            style={{
              borderRadius: "6px",
              backgroundColor: currentTheme.background_2,
              color: currentTheme.text_2,
            }}
          >
            Sign out
          </div>
        </div>
      </div>

      {showLeftBar && windowWidth !== null && (
        <div
          className={`z-[920] flex ${
            windowWidth < 1024 ? "" : "hidden"
          } w-full h-full fixed top-0 left-0`}
        >
          <div
            ref={showLeftBarRef}
            onClick={closeLeftBar}
            className="absolute top-0 left-0 w-[100vw] display-height flex items-center justify-center"
            style={{
              opacity: 0,
              transition:
                "opacity 0.5s ease-in-out, backdrop-filter 0.5s ease-in-out, -webkit-backdrop-filter 0.5s ease-in-out, background-color 0.5s ease-in-out",
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default LeftBar;
