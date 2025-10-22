// project/src/components/Settings/Account.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import Modal2Continue from "@/modals/Modal2Continue";
import { useModal2Store } from "@/store/useModalStore";
import { appTheme } from "@/util/appTheme";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { useContext } from "react";
import { IoMoonOutline } from "react-icons/io5";
import { LuSun } from "react-icons/lu";
import UserImage from "../blocks/UserImage";
import { useContextQueries } from "@/contexts/queryContext/queryContext";

const AccountSettings = () => {
  const { currentUser, handleLogout } = useContext(AuthContext);
  const { handleThemeChange } = useContextQueries();
  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);

  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];

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

  if (!currentUser) return null;

  return (
    <div className="relative ml-[5px] md:ml-[8px] w-[calc(100%-43px)] sm:w-[calc(100%-80px)] h-full flex flex-col pt-[50px]">
      <div className="ml-[1px] flex flex-row gap-[13.5px] items-center lg:mb-[18px] mb-[14px]">
        <p className="mt-[-2px] font-[600] text-[29px] leading-[29px] h-[40px] md:text-[32px] md:leading-[32px]">
          {currentUser.first_name} {currentUser.last_name}
        </p>
      </div>

      <div
        style={{
          border: `1px solid ${t.table_bg_2}`,
          backgroundColor: t.background_2,
        }}
        className="flex flex-row items-center gap-[12.2px] py-[12.2px] rounded-[10px] px-[14px]"
      >
        <div className="aspect-[1/1] h-[28px] flex items-center justify-center">
          <UserImage />
        </div>

        <div className="flex flex-col items-center">
          <p
            className="font-[400] text-[17px] mt-[-1px] opacity-[0.7]"
            style={{ color: t.text_3 }}
          >
            {currentUser.email}
          </p>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-[15px] absolute bottom-[32px] sm:flex sm:mt-[18px] w-[100%]">
        <div
          onClick={handleSignOut}
          className="dim select-none cursor-pointer w-[100%] sm:w-[50%] hover:brightness-75 h-[40px] flex items-center justify-center font-[600]"
          style={{
            borderRadius: "6px",
            backgroundColor: t.background_2,
            color: t.text_2,
          }}
        >
          Sign out
        </div>

        <div
          onClick={handleThemeChange}
          className="cursor-pointer w-[100%] sm:w-[50%] h-[40px] rounded-[10px] group transition-colors duration-500"
        >
          <div
            className="gap-[12px] w-full h-full group-hover:border-0 group-hover:bg-[var(--hover-bg)] rounded-[10px] flex justify-center items-center px-[15px] truncate font-[500] text-[16px]"
            style={
              {
                border: "0.5px solid " + t.text_4,
                transition: "background-color 0.2s ease-in-out",
                "--hover-bg": t.background_2,
              } as React.CSSProperties
            }
          >
            {currentUser.theme === "dark" ? (
              <LuSun
                size={20}
                title="Light Mode"
                className=""
                color={t.text_3}
              />
            ) : (
              <IoMoonOutline
                size={20}
                title="Dark Mode"
                className=""
                color={t.text_3}
              />
            )}
            <p
              style={{
                color: t.text_2,
              }}
            >
              {capitalizeFirstLetter(
                currentUser.theme === "dark" ? "light" : "dark"
              )}{" "}
              Mode
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
