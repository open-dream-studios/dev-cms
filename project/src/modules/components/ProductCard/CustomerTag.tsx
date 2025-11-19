import { AuthContext } from "@/contexts/authContext";
import { useModal1Store } from "@/store/useModalStore";
import { Customer, Product } from "@open-dream/shared";
import { formatPhone } from "@/util/functions/Customers";
import React, { useContext } from "react";
import { FaPlus } from "react-icons/fa6";
import CustomerSelection from "../Customers/CustomerSelection";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { useRouting } from "@/hooks/useRouting";
import { useCurrentTheme } from "@/hooks/useTheme";
import { capitalizeFirstLetter } from "@/util/functions/Data";

const CustomerTag = ({
  product,
  productCustomer,
  oneSize,
}: {
  product: Product | null;
  productCustomer: Customer | null;
  oneSize: boolean;
}) => {
  const { currentUser } = useContext(AuthContext);
  const { setCurrentCustomerData } = useCurrentDataStore();
  const { screenClick } = useRouting();
  const { screen } = useUiStore();
  const currentTheme = useCurrentTheme();

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
      content: <CustomerSelection product={product} />,
    });
  };

  if (!currentUser) return null;

  if (productCustomer) {
    return (
      <div
        style={{
          backgroundColor: currentTheme.background_2,
        }}
        className={`${
          oneSize
            ? "max-w-[260px] gap-[9px] px-[10.5px] py-[5.9px]"
            : "gap-[8px] px-[calc(7px+0.1vw)] py-[1.5%]"
        } w-[100%] cursor-pointer dim ${
          screen === "customers" ? "pointer-events-none" : "hover:brightness-90"
        } items-center flex flex-row rounded-full`}
        onClick={async (e) => {
          e.stopPropagation();
          setCurrentCustomerData(productCustomer);
          await screenClick("customers", "/");
        }}
      >
        <div
          className={`${
            oneSize
              ? "w-[34px] h-[34px] text-[13px] min-w-[33px] min-h-[33px]"
              : "min-w-[calc(22px+0.6vw)] min-h-[calc(22px+0.6vw)] aspect-[1/1] text-[calc(8px+0.2vw)]"
          } flex items-center justify-center rounded-full border font-semibold`}
          style={{
            borderColor: currentTheme.text_3,
            color: currentTheme.text_3,
          }}
        >
          {`${productCustomer.first_name?.[0] ?? ""}${
            productCustomer.last_name?.[0] ?? ""
          }`.toUpperCase()}
        </div>
        <div
          className={`${
            oneSize && "pt-[2px]"
          } w-[100%] flex flex-1 flex-col gap-[1px] h-[100%] justify-center`}
        >
          <div
            className={`${
              oneSize
                ? "text-[15px] leading-[17px]"
                : "text-[calc(11.5px+0.15vw)] leading-[calc(13px+0.4vw)]"
            } truncate font-[600]`}
          >
            {capitalizeFirstLetter(productCustomer.first_name)} {capitalizeFirstLetter(productCustomer.last_name)}
          </div>
          <div
            style={{
              color: currentTheme.text_4,
            }}
            className={`${
              oneSize
                ? "text-[14px] leading-[17px] gap-[8px] min-h-[20px]"
                : "text-[calc(11px+0.12vw)] leading-[calc(10px+0.3vw)] gap-[calc(6px+0.3vw)]"
            } font-[400] flex flex-row w-[100%]`}
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
          backgroundColor: currentTheme.background_2,
        }}
        className={`${
          oneSize
            ? "max-w-[220px] gap-[9px] px-[12px] py-[10px]"
            : "gap-[7px] px-[calc(0.24vw+5px)] py-[calc(0.2vw+3px)]"
        }
       w-[100%] cursor-pointer dim hover:brightness-90 items-center flex flex-row rounded-full`}
        onClick={(e) => {
          e.stopPropagation();
          handleAddCustomerClick();
        }}
      >
        <div
          className={`aspect-[1/1] ${
            oneSize
              ? "w-[24px] h-[24px]"
              : "w-[22px] min-w-[22px] lg:w-[24px] lg:min-w-[24px]"
          } opacity-[0.8] flex items-center justify-center rounded-full border font-semibold`}
          style={{
            borderColor: currentTheme.text_3,
            color: currentTheme.text_3,
          }}
        >
          <FaPlus className="w-[calc(27%+5px)]" />
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
