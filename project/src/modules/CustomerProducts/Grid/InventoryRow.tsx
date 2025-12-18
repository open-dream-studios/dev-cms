// project/src/modules/CustomerProducts/Grid/InventoryRow.tsx
"use client";
import { inventoryDataLayout } from "./InventoryGrid";
import InventoryRowForm from "./InventoryRowForm";
import { RiDraggable } from "react-icons/ri";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { AuthContext } from "@/contexts/authContext";
import React, { useContext } from "react";
import { FaCheck } from "react-icons/fa6";
import { Product } from "@open-dream/shared";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { useDataFilters } from "@/hooks/useDataFilters";
import { DelayType } from "@/hooks/util/useAutoSave";
import { useCurrentTheme } from "@/hooks/util/useTheme";

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
  const currentTheme = useCurrentTheme();

  if (!currentUser) return null;

  return (
    <div
      style={{
        backgroundColor: currentTheme.background_1,
        borderTop: `0.5px solid ${currentTheme.background_3}`,
        borderLeft: `0.5px solid ${currentTheme.background_3}`,
        borderRight: `0.5px solid ${currentTheme.background_3}`,
        borderBottom:
          index === filteredProducts(localProductsData).length - 1
            ? `1px solid ${currentTheme.background_3}`
            : `0.5px solid ${currentTheme.background_3}`,
      }}
      className="select-none w-[100%] flex flex-row h-[60px] items-center"
    >
      <div
        className={`${
          editingProducts && "hover:brightness-75 dim"
        } w-[48px] min-w-[48px] h-[100%] items-center justify-center flex`}
        style={{
          cursor: editingProducts ? "pointer" : "auto",
          borderRight: `1px solid ${currentTheme.background_3}`,
        }}
      >
        {editingProducts ? (
          <RiDraggable className="opacity-[0.5]" size={23}></RiDraggable>
        ) : (
          <>
            {productsData?.some((p) => p.product_id === product.product_id) && (
              <div
                onClick={() => {
                  if (!product.product_id) return;
                  if (selectedProducts.includes(product.product_id)) {
                    setSelectedProducts(
                      selectedProducts.filter((sn) => sn !== product.product_id)
                    );
                  } else {
                    setSelectedProducts([
                      ...selectedProducts,
                      product.product_id,
                    ]);
                  }
                }}
                style={{
                  border: `1px solid ${currentTheme.background_3}`,
                  backgroundColor:
                    product.product_id &&
                    selectedProducts.includes(product.product_id)
                      ? currentTheme.app_color_1
                      : "transparent",
                }}
                className="cursor-pointer dim w-[17px] h-[17px] rounded-[4px] flex items-center justify-center"
              >
                {product.product_id &&
                  selectedProducts.includes(product.product_id) && (
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
