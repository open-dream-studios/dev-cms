"use client";
import { useContext } from "react";
import React from "react";
import { useAppContext } from "@/contexts/appContext";
import CustomInventoryFrameSkeleton from "@/screens/Inventory/CustomInventoryFrame/CustomInventoryFrameSkeleton";
import "react-datepicker/dist/react-datepicker.css";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import ProductsHeader from "@/screens/Inventory/ProductsHeader";
import DraggableProductsGrid from "@/screens/Inventory/DraggableProductsGrid";
import InventoryGrid from "@/screens/Inventory/InventoryGrid";
import { useUI } from "@/contexts/uiContext";
import { AuthContext } from "@/contexts/authContext";
import ProductPage from "../Inventory/ProductPage/ProductPage";
import DraggableTubs from "./DraggableTubs";
import TubsHeader from "./TubsHeader";

const TubsInventory = () => {
  const { currentUser } = useContext(AuthContext);
  const { productsData, isLoadingProductsData } = useContextQueries();
  const { addProductPage, filteredProducts } = useAppContext();
  const { screen } = useUI();

  if (!currentUser) return null;

  return (
    <>
      {screen === "products-table" ? (
        <InventoryGrid />
      ) : (
        <>
          {addProductPage ? (
            <ProductPage />
          ) : (
            <div className="w-[100%] h-[100%] relative">
              <div className="z-[800] absolute top-0 left-0 h-[60px] w-[100%]">
                <TubsHeader title={"Products"} />
              </div>
              <div className="absolute h-[calc(100%-65px)] mt-[65px] left-0 w-[100%]">
                {productsData && filteredProducts(productsData).length > 0 ? (
                  <div className="w-[100%] h-[100%] overflow-y-scroll overflow-x-hidden px-[30px]">
                    {productsData &&
                      filteredProducts(productsData).length > 0 && (
                        <DraggableTubs sheet={false} />
                      )}
                    <div className="h-[60px] w-[100%]" />
                  </div>
                ) : isLoadingProductsData ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[20px] md:gap-[30px]">
                    {Array.from({ length: 6 }, (_, index) => {
                      return (
                        <div key={index}>
                          <CustomInventoryFrameSkeleton />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <></>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default TubsInventory;
