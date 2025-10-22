// project/src/modules/CustomerProducts/Grid/InventoryRow.tsx
"use client";
import { appTheme } from "@/util/appTheme";
import { inventoryDataLayout } from "./InventoryGrid";
import InventoryRowForm from "./InventoryRowForm";
import { RiDraggable } from "react-icons/ri";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { AuthContext } from "@/contexts/authContext";
import React, { useContext } from "react";
import { FaCheck } from "react-icons/fa6";
import { Product } from "@/types/products";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { useDataFilters } from "@/hooks/useDataFilters";
import { DelayType } from "@/hooks/useAutoSave";

const InventoryRow = ({
  resetTimer,
  index,
  product,
}: {
  resetTimer: (delay: DelayType) => void;
  index: number;
  product: Product;
}) => {
  const { currentUser } = useContext(AuthContext);
  const { productsData } = useContextQueries();
  const { filteredProducts } = useDataFilters();
  const { localProductsData, selectedProducts, setSelectedProducts } =
    useCurrentDataStore();
  const { editingProducts } = useUiStore();

  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];

  if (!currentUser) return null;

  return (
    <div
      style={{
        backgroundColor: t.background_1,
        borderTop: `0.5px solid ${t.background_3}`,
        borderLeft: `0.5px solid ${t.background_3}`,
        borderRight: `0.5px solid ${t.background_3}`,
        borderBottom:
          index === filteredProducts(localProductsData).length - 1
            ? `1px solid ${t.background_3}`
            : `0.5px solid ${t.background_3}`,
      }}
      className="select-none w-[100%] flex flex-row h-[60px] items-center"
    >
      <div
        className={`${
          editingProducts && "hover:brightness-75 dim"
        } w-[48px] min-w-[48px] h-[100%] items-center justify-center flex`}
        style={{
          cursor: editingProducts ? "pointer" : "auto",
          borderRight: `1px solid ${t.background_3}`,
        }}
      >
        {editingProducts ? (
          <RiDraggable className="opacity-[0.5]" size={23}></RiDraggable>
        ) : (
          <>
            {productsData?.some(
              (p) => p.serial_number === product.serial_number
            ) && (
              <div
                onClick={() => {
                  if (!product.serial_number) return;
                  if (selectedProducts.includes(product.serial_number)) {
                    setSelectedProducts(
                      selectedProducts.filter(
                        (sn) => sn !== product.serial_number
                      )
                    );
                  } else {
                    setSelectedProducts([
                      ...selectedProducts,
                      product.serial_number,
                    ]);
                  }
                }}
                style={{
                  border: `1px solid ${t.background_3}`,
                  backgroundColor:
                    product.serial_number &&
                    selectedProducts.includes(product.serial_number)
                      ? t.app_color_1
                      : "transparent",
                }}
                className="cursor-pointer dim w-[17px] h-[17px] rounded-[4px] flex items-center justify-center"
              >
                {product.serial_number &&
                  selectedProducts.includes(product.serial_number) && (
                    <FaCheck color={"white"} size={11} />
                  )}
              </div>
            )}
          </>
        )}
      </div>

      <InventoryRowForm
        product={product}
        inventoryDataLayout={inventoryDataLayout}
        resetTimer={resetTimer}
      />
    </div>
  );
};

export default InventoryRow;
