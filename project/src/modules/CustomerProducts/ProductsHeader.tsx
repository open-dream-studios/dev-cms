// project/src/modules/CustomerProducts/ProductsHeader.tsx
"use client";
import React, { useContext } from "react";
import { FiEdit } from "react-icons/fi";
import { PiExport } from "react-icons/pi";
import { BsWindow } from "react-icons/bs";
import { AuthContext } from "@/contexts/authContext";
import { appTheme } from "@/util/appTheme";
import { toast } from "react-toastify";
import { IoTrashSharp } from "react-icons/io5";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { usePathname } from "next/navigation";
import Modal2Continue from "@/modals/Modal2Continue";
import { useModal2Store } from "@/store/useModalStore";
import { FaPlus } from "react-icons/fa6";
import Modal2Input from "@/modals/Modal2Input";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/UIStore";
import { useRouting } from "@/hooks/useRouting";
import { useDataFilters } from "@/hooks/useDataFilters";
import { useProductFormSubmit } from "@/hooks/forms/useProductForm";
import { productFilter } from "@/types/filters";

const ProductsHeader = ({ title }: { title: String }) => {
  const { currentUser } = useContext(AuthContext);
  // const { handleRunModule } = use
  const { saveProducts } = useProductFormSubmit();
  const { productFilters, setProductFilters } = useCurrentDataStore();
  const { editingProducts, setEditingProducts } = useUiStore();
  const { currentProjectId, selectedProducts, setSelectedProducts } =
    useCurrentDataStore();
  const { deleteProducts, hasProjectModule } = useContextQueries();
  const { screenClick } = useRouting();
  const { setUpdatingLock, screen } = useUiStore();
  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);

  if (!currentProjectId) return null;

  const handleWixSync = async () => {
    if (!currentUser) return null;
    setModal2({
      ...modal2,
      open: !modal2.open,
      showClose: false,
      offClickClose: true,
      width: "w-[300px]",
      maxWidth: "max-w-[400px]",
      aspectRatio: "aspect-[5/2]",
      borderRadius: "rounded-[12px] md:rounded-[15px]",
      content: (
        <Modal2Continue
          text={`Sync data to Wix website?`}
          onContinue={wixSync}
          threeOptions={false}
        />
      ),
    });
  };

  const wixSync = async () => {
    setUpdatingLock(true);
    try {
      // await handleRunModule("products-wix-sync-cms-module");
    } catch (e) {
      toast.error("Wix sync failed");
    } finally {
      setUpdatingLock(false);
    }
  };

  const handleGoogleExport = async () => {
    setUpdatingLock(true);
    try {
      // await handleRunModule("products-export-to-sheets-module");
    } catch (e) {
      toast.error("Export failed");
    } finally {
      setUpdatingLock(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!currentUser) return null;
    setModal2({
      ...modal2,
      open: !modal2.open,
      showClose: false,
      offClickClose: true,
      width: "w-[300px]",
      maxWidth: "max-w-[400px]",
      aspectRatio: "aspect-[5/2]",
      borderRadius: "rounded-[12px] md:rounded-[15px]",
      content: (
        <Modal2Continue
          text={`Delete ${selectedProducts.length} product${
            selectedProducts.length > 1 ? "s" : ""
          } from inventory?`}
          onContinue={handleDeleteSelected}
          threeOptions={false}
        />
      ),
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) {
      toast.error("No products selected for deletion");
      return;
    }
    setUpdatingLock(true);
    try {
      await saveProducts();
      await deleteProducts(selectedProducts);
      // toast.success("Deleted successfully");
    } catch (e) {
      toast.error(
        `Failed to delete product${selectedProducts.length > 1 && "s"}`
      );
    } finally {
      setUpdatingLock(false);
      setSelectedProducts([]);
    }
  };

  const handleAddRow = () => {
    setEditingProducts(false);
    if (screen !== "customer-products-table") {
      screenClick("add-customer-product", "/products");
    } else {
      if (!currentUser) return null;
      setModal2({
        ...modal2,
        open: !modal2.open,
        showClose: false,
        offClickClose: true,
        width: "w-[300px]",
        maxWidth: "max-w-[400px]",
        aspectRatio: "aspect-[5/2]",
        borderRadius: "rounded-[12px] md:rounded-[15px]",
        content: (
          <Modal2Input
            text={`Enter a new product serial number:`}
            onContinue={(
              newSerial: string,
              newMake: string,
              newModel: string
            ) => addRow(newSerial, newMake, newModel)}
          />
        ),
      });
    }
  };

  const addRow = async (
    newSerial: string,
    newMake: string,
    newModel: string
  ) => {
    // const allOrdinals = localProductsData.map((p) => p.ordinal);
    // const nextOrdinal =
    //   allOrdinals.length > 0 ? Math.max(...allOrdinals) + 1 : 0;
    // const newProduct: Product = {
    //   serial_number: newSerial,
    //   customer_id: null,
    //   projext_idx
    //   name: "",
    //   make: newMake,
    //   model: newModel,
    //   length: 0,
    //   width: 0,
    //   height: 0,
    //   description: "",
    //   note: "",
    //   ordinal: nextOrdinal,
    // };
    // await saveProducts(newProduct);
  };

  const handleEditClick = () => {
    // setDataFilters({ jobType: [], products: [] });
    // setEditMode((prev) => !prev);
  };

  const handleFilterClick = async (filter: productFilter) => {
    let active = [...productFilters.products];

    if (active.includes(filter)) {
      active = active.filter((f) => f !== filter);
    } else {
      active.push(filter);
    }
    setProductFilters({ ...productFilters, products: active });
    setSelectedProducts([]);
    if (screen === "customer-products") {
      setEditingProducts(false);
    }
    if (screen === "customer-products-table") {
      await saveProducts();
    }
  };

  const handleJobFilterClick = async (
    filter: "Service" | "Refurbishment" | "Resell"
  ) => {
    let active = [...productFilters.jobType];
    if (active.includes(filter)) {
      active = active.filter((f) => f !== filter);
    } else {
      active.push(filter);
    }
    setProductFilters({ ...productFilters, jobType: active });
    setSelectedProducts([]);
    if (screen === "customer-products") {
      setEditingProducts(false);
    }
    if (screen === "customer-products-table") {
      await saveProducts();
    }
  };

  const handleViewClick = (view: string) => {
    if (view === "Products") {
      screenClick("customer-products", "/products");
    } else if (view === "Table") {
      screenClick("customer-products-table", "/products");
    }
  };

  if (!currentUser) return null;

  return (
    <div className="relative">
      {hasProjectModule("customer-products-module") && (
        <div className="flex flex-row items-center sm:justify-between justify-end h-[100%] mb-[17px] pt-[20px] px-[20px]">
          <div className="hidden sm:flex flex-row gap-[19px] items-center">
            {/* <h1 onClick={()=>{setScreen("customer-products-table")}}className="hidden md:flex mt-[-5px] text-2xl font-[600]">
              {title}
            </h1> */}

            <div
              style={{
                backgroundColor: appTheme[currentUser.theme].header_1_1,
              }}
              className="flex w-[160px] pl-[4px] h-[32px] rounded-[18px] flex-row items-center"
            >
              <div
                onClick={() => handleViewClick("Products")}
                style={{
                  backgroundColor:
                    screen === "customer-products"
                      ? appTheme[currentUser.theme].header_1_2
                      : "transparent",
                }}
                className="select-none cursor-pointer w-[76px] h-[26px] flex items-center justify-center text-[13px] font-[500] rounded-[18px]"
              >
                List
              </div>
              <div
                onClick={() => handleViewClick("Table")}
                style={{
                  backgroundColor:
                    screen === "customer-products-table"
                      ? appTheme[currentUser.theme].header_1_2
                      : "transparent",
                }}
                className="select-none cursor-pointer w-[76px] h-[26px] flex items-center justify-center text-[13px] font-[500] rounded-[18px]"
              >
                Table
              </div>
            </div>

            <div
              style={{
                backgroundColor: appTheme[currentUser.theme].header_1_1,
              }}
              className="flex w-[180px] pl-[4px] h-[32px] rounded-[18px] flex-row items-center"
            >
              <div
                onClick={() => handleFilterClick("Active")}
                style={{
                  backgroundColor: productFilters.products.includes("Active")
                    ? appTheme[currentUser.theme].header_1_2
                    : "transparent",
                }}
                className="select-none cursor-pointer w-[84px] h-[26px] flex items-center justify-center text-[13px] font-[500] rounded-[18px]"
              >
                Active
              </div>
              <div
                className="w-[1px] h-[22px] rounded-[4px] mx-[2px]"
                style={{
                  opacity: productFilters.products.length === 0 ? "0.1" : 0,
                  backgroundColor: appTheme[currentUser.theme].text_1,
                }}
              />
              <div
                onClick={() => handleFilterClick("Complete")}
                style={{
                  backgroundColor: productFilters.products.includes("Complete")
                    ? appTheme[currentUser.theme].header_1_2
                    : "transparent",
                }}
                className="select-none cursor-pointer w-[84px] h-[26px] flex items-center justify-center text-[13px] font-[500] rounded-[18px]"
              >
                Complete
              </div>
            </div>

            <div
              style={{
                backgroundColor: appTheme[currentUser.theme].header_1_1,
              }}
              className="flex w-[322px] pl-[4px] h-[32px] rounded-[18px] flex-row items-center"
            >
              <div
                onClick={() => handleJobFilterClick("Service")}
                style={{
                  backgroundColor: productFilters.jobType.includes("Service")
                    ? appTheme[currentUser.theme].header_1_2
                    : "transparent",
                }}
                className="select-none cursor-pointer w-[94px] h-[26px] flex items-center justify-center text-[13px] font-[500] rounded-[18px]"
              >
                Service
              </div>
              <div
                className="w-[1px] h-[22px] rounded-[4px] mx-[2px]"
                style={{
                  opacity:
                    (productFilters.jobType.length === 1 &&
                      productFilters.jobType[0] === "Resell") ||
                    productFilters.jobType.length === 0
                      ? "0.1"
                      : 0,
                  backgroundColor: appTheme[currentUser.theme].text_1,
                }}
              />
              <div
                onClick={() => handleJobFilterClick("Refurbishment")}
                style={{
                  backgroundColor: productFilters.jobType.includes(
                    "Refurbishment"
                  )
                    ? appTheme[currentUser.theme].header_1_2
                    : "transparent",
                }}
                className="select-none cursor-pointer w-[124px] h-[26px] flex items-center justify-center text-[13px] font-[500] rounded-[18px]"
              >
                Refurbishment
              </div>
              <div
                className="w-[1px] h-[22px] rounded-[4px] mx-[2px]"
                style={{
                  opacity:
                    (productFilters.jobType.length === 1 &&
                      productFilters.jobType[0] === "Service") ||
                    productFilters.jobType.length === 0
                      ? "0.1"
                      : 0,
                  backgroundColor: appTheme[currentUser.theme].text_1,
                }}
              />
              <div
                onClick={() => handleJobFilterClick("Resell")}
                style={{
                  backgroundColor: productFilters.jobType.includes("Resell")
                    ? appTheme[currentUser.theme].header_1_2
                    : "transparent",
                }}
                className="select-none cursor-pointer w-[94px] h-[26px] flex items-center justify-center text-[13px] font-[500] rounded-[18px]"
              >
                Resell
              </div>
            </div>
          </div>

          <div className="flex flex-row gap-[11px]">
            {hasProjectModule("products-export-to-sheets-module") && (
              <div
                style={{
                  backgroundColor: appTheme[currentUser.theme].background_2,
                }}
                className="dim hover:brightness-75 rounded-[25px] w-[33px] [@media(min-width:460px)]:w-[150px] h-[33px] flex flex-row justify-center items-center gap-[6px] text-[13px] font-[600] cursor-pointer"
                onClick={handleGoogleExport}
              >
                <p
                  style={{
                    color: appTheme[currentUser.theme].text_1,
                  }}
                  className="hidden [@media(min-width:460px)]:block"
                >
                  Export Sheet
                </p>

                <PiExport
                  color={appTheme[currentUser.theme].text_1}
                  size={18}
                />
              </div>
            )}

            {hasProjectModule("products-wix-sync-cms-module") && (
              <div
                style={{
                  backgroundColor: appTheme[currentUser.theme].background_2,
                }}
                className="dim hover:brightness-75 rounded-[25px] w-[33px] [@media(min-width:460px)]:w-[140px] h-[33px] flex flex-row justify-center items-center gap-[10px] text-[13px] font-[600] cursor-pointer"
                onClick={handleWixSync}
              >
                <p
                  style={{
                    color: appTheme[currentUser.theme].text_1,
                  }}
                  className="hidden [@media(min-width:460px)]:block"
                >
                  Sync Wix
                </p>

                <BsWindow
                  color={appTheme[currentUser.theme].text_1}
                  size={17}
                />
              </div>
            )}

            <div
              style={{
                backgroundColor: appTheme[currentUser.theme].background_2,
                border: editingProducts
                  ? `1px solid ${appTheme[currentUser.theme].text_1}`
                  : "none",
              }}
              className="mr-[2px] dim hover:brightness-75 rounded-[25px] w-[33px] h-[33px] flex flex-row justify-center items-center gap-[10px] text-[15px] cursor-pointer"
              onClick={handleEditClick}
            >
              <FiEdit
                size={17}
                color={appTheme[currentUser.theme].text_1}
                className="flex items-center justify-center"
              />
            </div>

            <div
              style={{
                backgroundColor: appTheme[currentUser.theme].background_2,
              }}
              className="mr-[2px] dim hover:brightness-75 rounded-[25px] w-[33px] h-[33px] flex flex-row justify-center items-center gap-[10px] text-[15px] cursor-pointer"
              onClick={handleAddRow}
            >
              <FaPlus
                size={17}
                color={appTheme[currentUser.theme].text_1}
                className="flex items-center justify-center"
              />
            </div>

            {selectedProducts.length > 0 &&
              screen === "customer-products-table" && (
                <div
                  style={{
                    backgroundColor: appTheme[currentUser.theme].background_2,
                  }}
                  className="mr-[2px] dim hover:brightness-75 rounded-[25px] w-[33px] h-[33px] flex flex-row justify-center items-center gap-[10px] text-[15px] cursor-pointer"
                  onClick={handleConfirmDelete}
                >
                  <IoTrashSharp
                    size={18}
                    color={appTheme[currentUser.theme].text_1}
                    className="flex items-center justify-center"
                  />
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsHeader;
