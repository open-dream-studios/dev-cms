// project/src/modules/CustomerProducts/Products.tsx
"use client";
import React, { useEffect } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { useContext } from "react";
import { useAppContext } from "@/contexts/appContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { AuthContext } from "@/contexts/authContext";
import DraggableItems from "./DraggableItems";
import ProductsHeader from "./ProductsHeader";
import CustomerProductSkeleton from "../components/ProductCard/CustomerProductSkeleton";
import ProductView from "./ProductView/ProductView";
import InventoryGrid from "./Grid/InventoryGrid";
import ModuleLeftBar from "../components/ModuleLeftBar";

const CustomerProducts = () => {
  const { currentUser } = useContext(AuthContext);
  const { productsData, isLoadingProductsData } = useContextQueries();
  const { screen, filteredProducts } = useAppContext();
  if (!currentUser) return null;

  return (
    <>
      {screen === "customer-products-table" ? (
        <InventoryGrid />
      ) : (
        <div className="w-[100%] h-[100%] flex flex-row overflow-auto">
          {(screen === "edit-customer-product" ||
            screen === "add-customer-product") && <ModuleLeftBar />}
          {screen === "add-customer-product" ? (
            <div className="flex justify-center flex-1">
              <ProductView />
            </div>
          ) : (
            <div className="w-[100%] h-[100%] relative">
              <div className="z-[800] absolute top-0 left-0 h-[60px] w-[100%]">
                <ProductsHeader title={"Inventory"} />
              </div>
              <div className="absolute h-[calc(100%-65px)] mt-[65px]  left-0 w-[100%]">
                {productsData && filteredProducts(productsData).length > 0 ? (
                  <div className="w-[100%] h-[100%] overflow-y-scroll overflow-x-hidden px-[30px]">
                    {productsData &&
                      filteredProducts(productsData).length > 0 && (
                        <DraggableItems sheet={false} />
                      )}
                    <div className="h-[60px] w-[100%]" />
                  </div>
                ) : isLoadingProductsData ? (
                  <div className="relative px-[30px] pt-[8px] grid grid-cols-1 sm:grid-cols-2 min-[1570px]:grid-cols-3 gap-[17px] md:gap-[20px] lg:gap-[22px]">
                    {Array.from({ length: 6 }, (_, index) => {
                      return (
                        <div key={index}>
                          <CustomerProductSkeleton />
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
        </div>
      )}
    </>
  );
};

export default CustomerProducts;
