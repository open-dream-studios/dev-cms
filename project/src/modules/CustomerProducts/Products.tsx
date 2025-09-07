// project/src/modules/CustomerProducts/Products.tsx
"use client";
import React from "react";
import "react-datepicker/dist/react-datepicker.css";
import { useContext } from "react";
import { useAppContext } from "@/contexts/appContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useUI } from "@/contexts/uiContext";
import { AuthContext } from "@/contexts/authContext";
import DraggableItems from "./DraggableItems";
import ProductsHeader from "./ProductsHeader";
import CustomerProductSkeleton from "../components/ProductCard/CustomerProductSkeleton";
import ProductPage from "./ProductView/ProductView"
import InventoryGrid from "./Grid/InventoryGrid";

const CustomerProducts = () => {
  const { currentUser } = useContext(AuthContext);
  const { productsData, isLoadingProductsData } = useContextQueries();
  const { addProductPage, filteredProducts } = useAppContext();
  const { screen } = useUI();

  if (!currentUser) return null;

  return (
    <>
      {screen === "customer-products-table" ? (
        <InventoryGrid />
      ) : (
        <>
          {addProductPage ? (
            // <ProductPage />
            <>hi</>
          ) : (
            <div className="w-[100%] h-[100%] relative">
              <div className="z-[800] absolute top-0 left-0 h-[60px] w-[100%]">
                <ProductsHeader title={"Inventory"} />
              </div>
              <div className="absolute h-[calc(100%-65px)] mt-[65px] left-0 w-[100%]">
                {productsData && filteredProducts(productsData).length > 0 ? (
                  <div className="w-[100%] h-[100%] overflow-y-scroll overflow-x-hidden px-[30px]">
                    {productsData &&
                      filteredProducts(productsData).length > 0 && (
                        <DraggableItems sheet={false} />
                      )}
                    <div className="h-[60px] w-[100%]" />
                  </div>
                ) : isLoadingProductsData ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[20px] md:gap-[30px]">
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
        </>
      )}
    </>
  );
};

export default CustomerProducts;
