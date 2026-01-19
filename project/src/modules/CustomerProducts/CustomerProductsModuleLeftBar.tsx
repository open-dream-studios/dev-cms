// project/src/modules/CustomerProductsModule/CustomerProductsModuleLeftBar.tsx
import { AuthContext } from "@/contexts/authContext";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import Divider from "@/lib/blocks/Divider";
import { Product } from "@open-dream/shared";
import React, { useContext } from "react";
import { FaPlus } from "react-icons/fa6";
import { useUiStore } from "@/store/useUIStore";
import { useFormInstanceStore } from "@/store/util/formInstanceStore";
import {
  setCurrentProductData,
  useCurrentDataStore,
} from "@/store/currentDataStore";
import { useRouting } from "@/hooks/useRouting";
import { productToForm } from "@/util/schemas/productSchema";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import ProductMiniCard from "../components/ProductCard/ProductMiniCard";
import ProductMiniCardSkeleton from "@/lib/skeletons/ProductMiniCardSkeleton";
import { homeLayoutLeftBarTopHeight } from "@/layouts/homeLayout";
import {
  haveImagesChanged,
  onProductFormSubmit,
} from "./_actions/products.actions";

const CustomerProductsModuleLeftBar = () => {
  const { currentUser } = useContext(AuthContext);
  const { isLoadingProductsData } = useContextQueries();
  const { localProductsData } = useCurrentDataStore();
  const { screenClick } = useRouting();
  const { getForm } = useFormInstanceStore();
  const { setAddingProduct } = useUiStore();
  const currentTheme = useCurrentTheme();

  const productForm = getForm("product");

  const handleProductClick = async (product: Product | null) => {
    if (productForm && (productForm.formState.isDirty || haveImagesChanged())) {
      await productForm.handleSubmit(onProductFormSubmit)();
    }

    await useFormInstanceStore.getState().flushDirtyForms("task-");
    await useFormInstanceStore.getState().flushDirtyForms("job-");

    if (product) {
      await screenClick(
        "customer-products",
        `/products/${product.serial_number}`
      );
    } else {
      await screenClick(
        "customer-products",
        `/products`
      );
    }
    setCurrentProductData(product);
    setAddingProduct(!product);
    if (productForm && !product) {
      productForm.reset(productToForm(null));
    }
  };

  const handlePlusClick = async () => {
    handleProductClick(null);
  };

  if (!currentUser) return null;

  return (
    <div
      className={`hidden md:flex w-[240px] min-w-[240px] h-full flex-col min-h-0 overflow-hidden`}
      style={{
        borderRight: `0.5px solid ${currentTheme.background_2}`,
      }}
    >
      <div className="flex flex-col px-[15px] pb-[8px]">
        <div
          className="flex flex-row items-center justify-between pt-[12px] pb-[6px]"
          style={{
            height: homeLayoutLeftBarTopHeight,
          }}
        >
          <div className="select-none flex flex-row gap-[13.5px] items-center w-[100%]">
            <p className="w-[100%] font-[600] h-[40px] truncate text-[24px] leading-[30px] mt-[1px]">
              Products
            </p>
          </div>
          <div className="flex flex-row gap-[6px]">
            <div
              onClick={handlePlusClick}
              className="dim cursor-pointer hover:brightness-[85%] min-w-[30px] w-[30px] h-[30px] mt-[-5px] rounded-full flex justify-center items-center"
              style={{
                backgroundColor: currentTheme.background_1_2,
              }}
            >
              <FaPlus size={12} />
            </div>
          </div>
        </div>
        <Divider />
      </div>

      <div className="flex-1 min-h-0 h-[100%]">
        <div className="w-[100%] h-[100%] pb-[20px] flex flex-col overflow-y-auto gap-[9px]">
          {isLoadingProductsData ? (
            <div className="px-[15px] flex flex-col gap-[9px]">
              {Array.from({ length: 4 }, (_, index) => {
                return <ProductMiniCardSkeleton key={index} />;
              })}
            </div>
          ) : (
            localProductsData.map((product: Product, index: number) => {
              return (
                <ProductMiniCard
                  key={index}
                  product={product}
                  index={index}
                  handleProductClick={handleProductClick}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerProductsModuleLeftBar;
