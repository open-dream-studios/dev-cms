import { useAppContext } from "@/contexts/appContext";
import { AuthContext } from "@/contexts/authContext";
import { useProjectContext } from "@/contexts/projectContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useModal1Store } from "@/store/useModalStore";
import { Customer } from "@/types/customers";
import { appTheme } from "@/util/appTheme";
import { formatPhone } from "@/util/functions/Customers";
import React, { useContext } from "react";
import { FaPlus } from "react-icons/fa6";
import CustomerSelection from "../Customers/CustomerSelection";
const CustomerTag = ({
  productCustomer,
}: {
  productCustomer: Customer | null;
}) => {
  const { currentUser } = useContext(AuthContext);
  const { setCurrentCustomerData } = useProjectContext();
  const { screenClick, productFormRef } = useAppContext();

  const modal1 = useModal1Store((state: any) => state.modal1);
  const setModal1 = useModal1Store((state: any) => state.setModal1);

  const handleAddCustomerClick = () => {
    setModal1({
      ...modal1,
      open: !modal1.open,
      showClose: true,
      offClickClose: true,
      width: "w-[90vw] md:w-[80vw]",
      maxWidth: "md:max-w-[1000px]",
      aspectRatio: "aspect-[2/2.1] md:aspect-[3/2]",
      borderRadius: "rounded-[15px] md:rounded-[20px]",
      content: <CustomerSelection />,
    });
  };

  if (!currentUser) return null;

  if (productCustomer) {
    return (
      <div
        style={{
          backgroundColor: appTheme[currentUser.theme].background_2,
        }}
        className="max-w-[260px] w-[100%] cursor-pointer dim hover:brightness-90 items-center flex flex-row gap-[9px] rounded-full px-[10.5px] py-[5.9px]"
        onClick={async (e) => {
          e.stopPropagation();
          setCurrentCustomerData(productCustomer);
          await screenClick("customers", "/");
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
        <div className="w-[100%] flex flex-1 pt-[2px] flex-col gap-[1px] h-[100%] justify-center">
          <div className="truncate text-[15px] leading-[17px] font-[600]">
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
    );
  } else {
    return (
      <div
        style={{
          backgroundColor: appTheme[currentUser.theme].background_2,
        }}
        className="max-w-[220px] w-[100%] cursor-pointer dim hover:brightness-90 items-center flex flex-row gap-[9px] rounded-full px-[12px] py-[10px]"
        onClick={handleAddCustomerClick}
      >
        <div
          className="opacity-[0.8] w-[24px] h-[24px] flex items-center justify-center rounded-full border font-semibold text-[13px]"
          style={{
            borderColor: appTheme[currentUser.theme].text_3,
            color: appTheme[currentUser.theme].text_3,
          }}
        >
          <FaPlus />
        </div>
        <div className="w-[100%] flex flex-1 ml-[2px] flex-col gap-[1px] h-[100%] justify-center">
          <div className="opacity-[0.69] truncate text-[16px] leading-[17px] font-[600]">
            Customer
          </div>
        </div>
      </div>
    );
  }
};

export default CustomerTag;
