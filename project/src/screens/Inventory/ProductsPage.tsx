"use client";
import { useContext } from "react";
import { AuthContext } from "../../contexts/authContext";
import React from "react";
import { useAppContext } from "@/contexts/appContext";
import CustomInventoryFrameSkeleton from "@/screens/Inventory/CustomInventoryFrame/CustomInventoryFrameSkeleton";
import "react-datepicker/dist/react-datepicker.css";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import ProductPage from "../../screens/Inventory/ProductPage/ProductPage";
import ProductsHeader from "@/screens/Inventory/ProductsHeader";
import DraggableProductsGrid from "@/screens/Inventory/DraggableProductsGrid";
import InventoryGrid from "@/screens/Inventory/InventoryGrid";

const ProductsPage = () => {
  const { currentUser } = useContext(AuthContext);
  const { productsData, isLoadingProductsData } = useContextQueries();
  const { screen, filteredProducts } = useAppContext();

  if (!currentUser) return null;

  return (
    <>
      {screen === "add-product" ? (
        <ProductPage />
      ) : (
        <div className="w-[100%] h-[100%] relative">
          <div className="z-[800] absolute top-0 left-0 h-[60px] w-[100%]">
            <ProductsHeader title={"Products"} />
          </div>
          <div className="absolute h-[calc(100%-65px)] mt-[65px] left-0 w-[100%]">
            {productsData && filteredProducts(productsData).length > 0 ? (
              <div className="w-[100%] h-[100%] overflow-y-scroll overflow-x-hidden px-[30px]">
                {productsData && filteredProducts(productsData).length > 0 && (
                  <DraggableProductsGrid sheet={false} />
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
  );
};

export default ProductsPage;
