// project/src/modules/CustomerProducts/ProductCard/ProductFrame.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import { appTheme } from "@/util/appTheme";
import { useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/products";
import { useProjectContext } from "@/contexts/projectContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { formatPhone } from "@/util/functions/Customers";
import { Customer } from "@/types/customers";
import app_details from "../../../util/appDetails.json";
import { MediaLink } from "@/types/media";
import { useUI } from "@/contexts/uiContext";
import { useAppContext } from "@/contexts/appContext";

const CustomerProductFrame = ({
  product,
  index,
}: {
  product: Product;
  index: number;
}) => {
  const { currentUser } = useContext(AuthContext);
  const { pageClick } = useAppContext();
  const { projectsData, customers, mediaLinks } = useContextQueries();
  const { currentProjectId, currentCustomer, setCurrentCustomerData } =
    useProjectContext();
  const { setScreen } = useUI();

  const currentProject = useMemo(() => {
    return projectsData.find((p) => p.id === currentProjectId) ?? null;
  }, [projectsData, currentProjectId]);

  const router = useRouter();
  const TubID = product.serial_number;

  const handleClick = () => {
    router.push(
      TubID && TubID.trim().length !== 0 ? `/products/${TubID}` : "/products"
    );
  };

  const productCustomer = useMemo(() => {
    if (!product || !product.customer_id) return null;
    return customers.find(
      (customer: Customer) => customer.id === product.customer_id
    );
  }, [customers]);

  const itemImage = useMemo(() => {
    const mediaLinksFound = mediaLinks.filter(
      (m: MediaLink) =>
        m.entity_type === "product" && m.entity_id === product.id
    );
    return mediaLinksFound.length > 0 ? mediaLinksFound[0] : null;
  }, [product, mediaLinks]);

  if (!currentUser) return null;

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
            {!itemImage ? (
              <img
                draggable={false}
                className="w-full h-full object-cover"
                src={app_details.default_img}
              />
            ) : /\.(mp4|mov)$/i.test(itemImage.url) ? (
              <video
                src={itemImage.url}
                className="w-full h-full object-cover"
                playsInline
                muted
                loop
              />
            ) : (
              <img
                draggable={false}
                className="w-full h-full object-cover"
                src={itemImage.url}
              />
            )}
          </div>
        </div>
        <div className="flex flex-col gap-[10px] w-[100%] h-[100%]">
          {productCustomer && (
            <div
              style={{
                backgroundColor: appTheme[currentUser.theme].background_3,
              }}
              className="w-[100%] dim hover:brightness-90 items-center flex flex-row gap-[9px] rounded-full px-[11px] pt-[7px] pb-[5px]"
              onClick={async (e) => {
                e.stopPropagation();
                setScreen("customers");
                setCurrentCustomerData(productCustomer);
                await pageClick("/");
              }}
            >
              <div
                className="w-[34px] h-[34px] flex items-center justify-center rounded-full border font-semibold text-[13px] min-w-[33px] min-h-[33px]"
                style={{
                  borderColor: appTheme[currentUser.theme].text_3,
                  color: appTheme[currentUser.theme].text_3,
                }}
              >
                {`${productCustomer.first_name?.[0] ?? ""}${
                  productCustomer.last_name?.[0] ?? ""
                }`.toUpperCase()}
              </div>
              <div className="w-[100%] flex flex-1 flex-col gap-[1px] h-[100%] justify-center">
                <div className="text-[15px] leading-[17px] font-[600]">
                  {productCustomer.first_name} {productCustomer.last_name}
                </div>
                <div
                  style={{
                    color: appTheme[currentUser.theme].text_4,
                  }}
                  className="text-[14px] leading-[17px] font-[400] flex flex-row gap-[8px] w-[100%] min-h-[20px]"
                >
                  <div className="flex items-center gap-2">
                    {productCustomer.phone && (
                      <span className="w-[100px]">
                        {formatPhone(productCustomer.phone)}
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
              {product.make ? product.make : "Make"}
            </div>
            <div
              className="font-[300] text-[16px] leading-[22px]"
              style={{ color: appTheme[currentUser.theme].text_3 }}
            >
              {product.model ? product.model : "Make"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProductFrame;
