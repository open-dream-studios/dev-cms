import { AuthContext } from '@/contexts/authContext'
import { appTheme } from '@/util/appTheme'
import React, { useContext, useState } from 'react'
import EditModules from './EditModules'
import Divider from '@/lib/blocks/Divider'
import EditPageDefinitions from './EditPageDefinitions'

export type Control = "modules" | "pages"

const AdminController = () => {
  const { currentUser } = useContext(AuthContext)
  if (!currentUser) return null

  const [controlActive, setControlActive] = useState<Control>("modules")
  const handleControlClick = (control: Control) => {
    setControlActive(control)
  }

  return (
    <div className="w-[100%] flex flex-col gap-[8px] px-[50px] py-[33px] h-[100%] overflow-y-scroll">
      <div className="flex flex-row gap-[19px] items-center">
        <h1 className="flex mt-[-4px] text-[25px] md:text-[30px] font-[600]">
          Controllers
        </h1>
        <div
          style={{
            backgroundColor: appTheme[currentUser.theme].header_1_1,
          }}
          className="flex w-[196px] pl-[4px] h-[32px] rounded-[18px] flex-row items-center"
        >
          <div
            onClick={() => setControlActive("modules")}
            style={{
              backgroundColor:
                controlActive === "modules"
                  ? appTheme[currentUser.theme].header_1_2
                  : "transparent",
            }}
            className="select-none cursor-pointer w-[94px] h-[26px] flex items-center justify-center text-[13px] font-[500] rounded-[18px]"
          >
            Modules
          </div>
          <div
            onClick={() => handleControlClick("pages")}
            style={{
              backgroundColor:
                controlActive === "pages"
                  ? appTheme[currentUser.theme].header_1_2
                  : "transparent",
            }}
            className="select-none cursor-pointer w-[94px] h-[26px] flex items-center justify-center text-[13px] font-[500] rounded-[18px]"
          >
            Pages
          </div>
        </div>
      </div>

      <Divider />

      <div className="flex-1">
        {controlActive === "modules" && <EditModules />}
        {controlActive === "pages" && <EditPageDefinitions />}
      </div>

    </div>
  )
}

export default AdminController