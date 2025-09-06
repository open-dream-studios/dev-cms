// project/src/screens/Inventory/CustomInventoryFrame/CustomInventoryFrame.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { appTheme } from "@/util/appTheme";
import { useContext, useMemo } from "react";
import app_details from "@/util/appDetails.json";
import { useRouter } from "next/navigation";
import { Product } from "@/types/products";
import { useProjectContext } from "@/contexts/projectContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { formatPhone } from "@/util/functions/Customers";

const TubDisplay = ({ item, index }: { item: Product; index: number }) => {
  const { currentUser } = useContext(AuthContext);
  const { projectsData } = useContextQueries();
  const { currentProjectId, currentCustomer } = useProjectContext();

  const currentProject = useMemo(() => {
    return projectsData.find((p) => p.id === currentProjectId) ?? null;
  }, [projectsData, currentProjectId]);

  const router = useRouter();
  const TubTitle = item.name;
  const TubMake = item.make;
  const TubModel = item.model;
  const TubPrice = "$" + item.price;
  const TubID = item.serial_number;

  const handleClick = () => {
    router.push(
      TubID && TubID.trim().length !== 0 ? `/products/${TubID}` : "/products"
    );
  };

  if (!currentUser) return null;

  // console.log(item)

  return (
    <div
      onClick={handleClick}
      className="aspect-[16/11] select-none group cursor-pointer rounded-[15px] overflow-hidden relative w-[100%] flex flex-col"
      style={{
        backgroundColor: appTheme[currentUser.theme].background_2,
      }}
    >
      <div className="w-[100%] h-[60%] select-none py-[25px] px-[28px] flex flex-row gap-[15px]">
        <div className="h-[100%] aspect-[1/1]">
          <div className="w-[100%] h-[100%] rounded-[10px] overflow-hidden">
            {item.images.length === 0 ? (
              <img
                draggable={false}
                className="w-full h-full object-cover"
                src={app_details.default_img}
              />
            ) : /\.(mp4|mov)$/i.test(item.images[0]) ? (
              <video
                src={item.images[0].url}
                className="w-full h-full object-cover"
                playsInline
                muted
                loop
              />
            ) : (
              <img
                draggable={false}
                className="w-full h-full object-cover"
                src={item.images[0].url}
              />
            )}
          </div>
        </div>
        <div className="flex flex-col gap-[15px] w-[100%] h-[100%]">
          {currentCustomer && (
            <div
              style={{
                backgroundColor: appTheme[currentUser.theme].background_3,
              }}
              className="w-[100%] items-center flex flex-row gap-[9px] rounded-full px-[11px] pt-[7px] pb-[5px]"
            >
              <div
                className="w-[34px] h-[34px] flex items-center justify-center rounded-full border font-semibold text-[13px] min-w-[33px] min-h-[33px]"
                style={{
                  borderColor: appTheme[currentUser.theme].text_3,
                  color: appTheme[currentUser.theme].text_3,
                }}
              >
                {`${currentCustomer.first_name?.[0] ?? ""}${
                  currentCustomer.last_name?.[0] ?? ""
                }`.toUpperCase()}
              </div>
              <div className="w-[100%] flex flex-1 flex-col gap-[1px] h-[100%] justify-center">
                <div className="text-[15px] leading-[17px] font-[600]">
                  {currentCustomer.first_name} {currentCustomer.last_name}
                </div>
                <div
                  style={{
                    color: appTheme[currentUser.theme].text_4,
                  }}
                  className="text-[14px] leading-[17px] font-[400] flex flex-row gap-[8px] w-[100%] min-h-[20px]"
                >
                  <div className="flex items-center gap-2">
                    {currentCustomer.phone && (
                      <span className="w-[100px]">
                        {formatPhone(currentCustomer.phone)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="w-[100%] h-[100%] gap-[2.5px] flex flex-col ml-[2.5px]">
            <div
              className="font-[600] text-[18.5px] leading-[25px]"
              style={{ color: appTheme[currentUser.theme].text_1 }}
            >
              {item.make ? item.make : "Make"}
            </div>
            <div
              className="font-[300] text-[16px] leading-[22px]"
              style={{ color: appTheme[currentUser.theme].text_3 }}
            >
              {item.model ? item.model : "Make"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TubDisplay;
