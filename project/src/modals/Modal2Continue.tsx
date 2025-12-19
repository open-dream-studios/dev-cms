// project/src/modals/Modal2Continue.tsx
"use client";
import { useContext, useEffect } from "react";
import { AuthContext } from "../contexts/authContext";
import { getInnerCardStyle } from "@/styles/themeStyles";
import { useRouting } from "@/hooks/useRouting";
import { capitalizeFirstLetter } from "@/util/functions/Data";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { Job, Product } from "@open-dream/shared";
import { useUiStore } from "@/store/useUIStore";
import { PopupDisplayItem } from "./_actions/modals.actions";

type Modal2ContinueProps = {
  text: string;
  threeOptions: boolean;
  onContinue: () => void;
  onNoSave?: () => void;
  displayItems?: PopupDisplayItem[];
};

const Modal2Continue: React.FC<Modal2ContinueProps> = ({
  text,
  threeOptions,
  onContinue,
  onNoSave,
  displayItems,
}) => {
  const { currentUser } = useContext(AuthContext);
  const { jobs, productsData } = useContextQueries();
  const { screenClick } = useRouting();
  const currentTheme = useCurrentTheme();
  const { modal2, setModal2 } = useUiStore();

  const handleContinue = () => {
    setModal2({ ...modal2, open: false });
    onContinue();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        handleContinue();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCancel = () => {
    setModal2({
      ...modal2,
      open: false,
    });
  };

  const handleNoSave = () => {
    setModal2({
      ...modal2,
      open: false,
    });

    if (onNoSave) {
      onNoSave();
    }
  };

  const onDisplayItemClick = async (item: PopupDisplayItem) => {
    handleCancel();
    if (item.type === "product" && item.title) {
      await screenClick("products", `/products/${item.title}`);
    }
    if (item.type === "job") {
      const matchedJob = jobs.find((job: Job) => job.id === item.id);
      if (matchedJob) {
        const matchedProduct = productsData.find(
          (product: Product) => product.id === matchedJob.product_id
        );
        if (matchedProduct && matchedProduct.serial_number) {
          await screenClick(
            "products",
            `/products/${matchedProduct.serial_number}`
          );
        }
      }
    }
  };

  if (!currentUser) return null;
  return (
    <div className="py-[14px] w-full h-full flex items-center justify-center flex-col">
      <div
        style={{ color: currentTheme.text_1 }}
        className="text-center px-[20px] font-[500]"
      >
        {text}
      </div>

      {displayItems && (
        <div className="w-[100%] px-[20px] mt-[7px]">
          <p className="font-[400] text-[15px] leading-[18px] opacity-[0.45] mb-[10px] text-center">
            This item is being used
          </p>
          {displayItems.map((item: PopupDisplayItem, index: number) => {
            return (
              <div
                key={index}
                onClick={async () => await onDisplayItemClick(item)}
                style={getInnerCardStyle(currentUser.theme, currentTheme)}
                className="px-[12px] w-[100%] h-[39px] flex flex-row items-center gap-[9px] rounded-[9px] cursor-pointer hover:brightness-75 dim"
              >
                <div
                  className="w-[9px] h-[9px] rounded-full"
                  style={{ backgroundColor: currentTheme.app_color_1 }}
                ></div>
                <p>{`${capitalizeFirstLetter(item.type)} - ${item.title}`}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-[14px] h-[40px] px-[20px] flex flex-row gap-[10px] w-[100%]">
        <div
          className="select-none dim hover:brightness-90 cursor-pointer flex-1 h-full rounded-[10px] flex items-center justify-center"
          style={{
            width: threeOptions ? "50%" : "33%",
            color: currentTheme.text_1,
            backgroundColor: currentTheme.background_2_2,
          }}
          onClick={handleCancel}
        >
          Cancel
        </div>
        {threeOptions && (
          <div
            className="w-[33%] select-none dim hover:brightness-75 cursor-pointer flex-1 h-full rounded-[10px] flex items-center justify-center"
            style={{
              color: currentTheme.text_1,
              backgroundColor: currentTheme.background_2_2,
            }}
            onClick={handleNoSave}
          >
            No
          </div>
        )}
        <div
          className="w-[50%] select-none dim hover:brightness-75 cursor-pointer flex-1 h-full rounded-[10px] flex items-center justify-center"
          style={{
            width: threeOptions ? "50%" : "33%",
            color: currentTheme.background_1_2,
            backgroundColor: currentTheme.text_3,
          }}
          onClick={handleContinue}
        >
          {threeOptions ? "Yes" : "Continue"}
        </div>
      </div>
    </div>
  );
};

export default Modal2Continue;
