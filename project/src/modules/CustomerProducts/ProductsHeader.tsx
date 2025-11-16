// project/src/modules/CustomerProducts/ProductsHeader.tsx
"use client";
import React, { useContext, useEffect, useRef, useState } from "react";
import { FiEdit } from "react-icons/fi";
import { PiExport } from "react-icons/pi";
import { BsFilter, BsWindow } from "react-icons/bs";
import { AuthContext } from "@/contexts/authContext";
import { toast } from "react-toastify";
import { IoTrashSharp } from "react-icons/io5";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useModal2Store } from "@/store/useModalStore";
import { FaPlus } from "react-icons/fa6";
import Modal2Input from "@/modals/Modal2Input";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { useRouting } from "@/hooks/useRouting";
import { useProductFormSubmit } from "@/hooks/forms/useProductForm";
import { productFilter, Product } from "@open-dream/shared";
import { productToForm } from "@/util/schemas/productSchema";
import { useModals } from "@/hooks/useModals";
import { runFrontendModule } from "../runFrontendModule";
import { getCardStyle } from "@/styles/themeStyles";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { useCurrentTheme } from "@/hooks/useTheme";

const ProductsHeader = ({ title }: { title: string }) => {
  const { currentUser } = useContext(AuthContext);
  const { saveProducts } = useProductFormSubmit();
  const {
    productFilters,
    setProductFilters,
    currentProject,
    currentProjectId,
    selectedProducts,
    setSelectedProducts,
    localProductsData,
  } = useCurrentDataStore();
  const {
    editingProducts,
    setEditingProducts,
    setUpdatingLock,
    setAddingProduct,
    inventoryView,
    setInventoryView,
  } = useUiStore();
  const { promptContinue } = useModals();
  const { deleteProducts, hasProjectModule, projectModules, integrations } =
    useContextQueries();
  const { screenClick } = useRouting();
  const { onProductFormSubmit } = useProductFormSubmit();
  const currentTheme = useCurrentTheme();

  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);

  const [showFilterPopup, setShowFilterPopup] = useState<boolean>(false);
  const showFilterPopupRef = useRef<boolean>(false);
  const filterPopupRef = useRef<HTMLDivElement | null>(null);
  const handleFilterButtonClick = () => {
    setShowFilterPopup(true);
    showFilterPopupRef.current = true;
  };
  useOutsideClick(filterPopupRef, () => {
    if (showFilterPopup) {
      setShowFilterPopup(false);
      showFilterPopupRef.current = false;
    }
  });

  useEffect(() => {
    const handleResize = () => {
      if (showFilterPopupRef.current) {
        setShowFilterPopup(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleWixSync = async () => {
    await promptContinue(`Sync data to Wix website?`, false, () => {}, wixSync);
  };

  const wixSync = async () => {
    setUpdatingLock(true);
    try {
      if (currentProject) {
        await runFrontendModule("customer-products-wix-sync-module", {
          currentProject,
        });
      }
    } catch (e) {
      toast.error("Wix sync failed");
    } finally {
      setUpdatingLock(false);
    }
  };

  const handleGoogleExport = async () => {
    await promptContinue(
      `Export data to google sheets?`,
      false,
      () => {},
      googleExport
    );
  };

  const googleExport = async () => {
    setUpdatingLock(true);
    try {
      if (currentProject) {
        await runFrontendModule("customer-products-google-sheets-module", {
          currentProject,
        });
      }
    } catch (e) {
      toast.error("Export failed");
    } finally {
      setUpdatingLock(false);
    }
  };

  const handleConfirmDelete = async () => {
    await promptContinue(
      `Delete ${selectedProducts.length} product${
        selectedProducts.length > 1 ? "s" : ""
      } from inventory?`,
      false,
      () => {},
      handleDeleteSelected
    );
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
    if (!inventoryView) {
      screenClick("customer-products", "/products");
      setAddingProduct(true);
    } else {
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
    if (!currentProjectId) return null;
    const allOrdinals = localProductsData.map((p) => p.ordinal);
    const nextOrdinal =
      allOrdinals.length > 0 ? Math.max(...allOrdinals) + 1 : 0;
    const newProduct: Product = {
      serial_number: newSerial,
      product_id: null,
      customer_id: null,
      project_idx: currentProjectId,
      name: "",
      make: newMake,
      model: newModel,
      length: 0,
      width: 0,
      height: 0,
      description: "",
      note: "",
      ordinal: nextOrdinal,
    };
    await onProductFormSubmit(productToForm(newProduct));
  };

  const handleEditClick = () => {
    setProductFilters({ jobType: [], products: [] });
    requestAnimationFrame(() => setEditingProducts(!editingProducts));
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
    if (inventoryView) {
      await saveProducts();
    } else {
      setEditingProducts(false);
    }
  };

  const handleJobFilterClick = async (
    filter: "Service" | "Refurbishment" | "Sale"
  ) => {
    let active = [...productFilters.jobType];
    if (active.includes(filter)) {
      active = active.filter((f) => f !== filter);
    } else {
      active.push(filter);
    }
    setProductFilters({ ...productFilters, jobType: active });
    setSelectedProducts([]);
    if (inventoryView) {
      await saveProducts();
    } else {
      setEditingProducts(false);
    }
  };

  const handleViewClick = async (tableView: boolean) => {
    if (inventoryView) {
      await saveProducts();
    }
    setInventoryView(tableView);
  };

  if (!currentUser) return null;

  const FilterSelections = ({ popup }: { popup: boolean }) => {
    return (
      <div
        className={`flex ${
          popup ? "flex-col gap-[6px]" : "flex-row gap-[13px]"
        }`}
      >
        <div
          style={{
            backgroundColor: currentTheme.header_1_1,
          }}
          className="flex w-[184px] pl-[4px] h-[32px] rounded-[18px] flex-row items-center"
        >
          <div
            onClick={() => handleFilterClick("Active")}
            style={{
              backgroundColor: productFilters.products.includes("Active")
                ? currentTheme.header_1_2
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
              backgroundColor: currentTheme.text_1,
            }}
          />
          <div
            onClick={() => handleFilterClick("Complete")}
            style={{
              backgroundColor: productFilters.products.includes("Complete")
                ? currentTheme.header_1_2
                : "transparent",
            }}
            className="select-none cursor-pointer w-[88px] h-[26px] flex items-center justify-center text-[13px] font-[500] rounded-[18px]"
          >
            Complete
          </div>
        </div>

        <div
          style={{
            backgroundColor: currentTheme.header_1_1,
          }}
          className="flex w-[330px] pl-[4px] h-[32px] rounded-[18px] flex-row items-center"
        >
          <div
            onClick={() => handleJobFilterClick("Service")}
            style={{
              backgroundColor: productFilters.jobType.includes("Service")
                ? currentTheme.header_1_2
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
                  productFilters.jobType[0] === "Sale") ||
                productFilters.jobType.length === 0
                  ? "0.1"
                  : 0,
              backgroundColor: currentTheme.text_1,
            }}
          />
          <div
            onClick={() => handleJobFilterClick("Refurbishment")}
            style={{
              backgroundColor: productFilters.jobType.includes("Refurbishment")
                ? currentTheme.header_1_2
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
              backgroundColor: currentTheme.text_1,
            }}
          />
          <div
            onClick={() => handleJobFilterClick("Sale")}
            style={{
              backgroundColor: productFilters.jobType.includes("Sale")
                ? currentTheme.header_1_2
                : "transparent",
            }}
            className="select-none cursor-pointer w-[94px] h-[26px] flex items-center justify-center text-[13px] font-[500] rounded-[18px]"
          >
            Sale
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {hasProjectModule("customer-products-module") && (
        <div className="flex flex-row items-center min-[400px]:justify-between justify-end h-[100%] mb-[17px] pt-[20px] px-[20px]">
          <div className="hidden min-[400px]:flex flex-row gap-[13px] items-center">
            <div
              style={{
                backgroundColor: currentTheme.header_1_1,
              }}
              className="flex w-[160px] pl-[4px] h-[32px] rounded-[18px] flex-row items-center"
            >
              <div
                onClick={() => handleViewClick(false)}
                style={{
                  backgroundColor: !inventoryView
                    ? currentTheme.header_1_2
                    : "transparent",
                }}
                className="select-none cursor-pointer w-[76px] h-[26px] flex items-center justify-center text-[13px] font-[500] rounded-[18px]"
              >
                List
              </div>
              <div
                onClick={() => handleViewClick(true)}
                style={{
                  backgroundColor: inventoryView
                    ? currentTheme.header_1_2
                    : "transparent",
                }}
                className="select-none cursor-pointer w-[76px] h-[26px] flex items-center justify-center text-[13px] font-[500] rounded-[18px]"
              >
                Table
              </div>
            </div>

            <div className="hidden min-[1380px]:flex">
              <FilterSelections popup={false} />
            </div>

            <div className="relative">
              <div
                onClick={handleFilterButtonClick}
                style={{
                  backgroundColor: currentTheme.header_1_1,
                  border:
                    productFilters.products.length ||
                    productFilters.jobType.length
                      ? `1px solid ${currentTheme.text_1}`
                      : "none",
                }}
                className="flex min-[1380px]:hidden w-[30px] h-[30px] rounded-full justify-center items-center pt-[1px] cursor-pointer hover:brightness-90 dim ml-[-3px] min-[1380px]:ml-0"
              >
                <BsFilter size={18} />
              </div>
              {showFilterPopup && (
                <div
                  ref={filterPopupRef}
                  style={getCardStyle(currentUser.theme, currentTheme)}
                  className="absolute bottom-[-92px] left-[-140px] min-[600px]:left-[-25px] h-[86px] justify-center items-start rounded-[10px] px-[6px] flex flex-col"
                >
                  <FilterSelections popup={true} />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-row gap-[12px] min-[700px]:gap-[10px]">
            {hasProjectModule("customer-products-module") && (
              <div
                style={{
                  backgroundColor: currentTheme.background_2,
                }}
                className="dim hover:brightness-75 rounded-[25px] w-[33px] min-[700px]:w-[140px] h-[33px] flex flex-row justify-center items-center gap-[6px] text-[13px] font-[600] cursor-pointer"
                onClick={handleGoogleExport}
              >
                <p
                  style={{
                    color: currentTheme.text_1,
                  }}
                  className="hidden min-[700px]:flex"
                >
                  Export Sheet
                </p>

                <PiExport color={currentTheme.text_1} size={18} />
              </div>
            )}

            {hasProjectModule("customer-products-module") && (
              <div
                style={{
                  backgroundColor: currentTheme.background_2,
                }}
                className="dim hover:brightness-75 rounded-[25px] w-[33px] min-[700px]:w-[140px] h-[33px] flex flex-row justify-center items-center gap-[10px] text-[13px] font-[600] cursor-pointer"
                onClick={handleWixSync}
              >
                <p
                  style={{
                    color: currentTheme.text_1,
                  }}
                  className="hidden min-[700px]:flex"
                >
                  Sync Wix
                </p>

                <BsWindow color={currentTheme.text_1} size={17} />
              </div>
            )}

            <div
              style={{
                backgroundColor: currentTheme.background_2,
                border: editingProducts
                  ? `1px solid ${currentTheme.text_1}`
                  : "none",
              }}
              className="mr-[2px] dim hover:brightness-75 rounded-[25px] w-[33px] h-[33px] flex flex-row justify-center items-center gap-[10px] text-[15px] cursor-pointer"
              onClick={handleEditClick}
            >
              <FiEdit
                size={17}
                color={currentTheme.text_1}
                className="flex items-center justify-center"
              />
            </div>

            <div
              style={{
                backgroundColor: currentTheme.background_2,
              }}
              className="mr-[2px] dim hover:brightness-75 rounded-[25px] w-[33px] h-[33px] flex flex-row justify-center items-center gap-[10px] text-[15px] cursor-pointer"
              onClick={handleAddRow}
            >
              <FaPlus
                size={17}
                color={currentTheme.text_1}
                className="flex items-center justify-center"
              />
            </div>

            {selectedProducts.length > 0 && inventoryView && (
              <div
                style={{
                  backgroundColor: currentTheme.background_2,
                }}
                className="mr-[2px] dim hover:brightness-75 rounded-[25px] w-[33px] h-[33px] flex flex-row justify-center items-center gap-[10px] text-[15px] cursor-pointer"
                onClick={handleConfirmDelete}
              >
                <IoTrashSharp
                  size={18}
                  color={currentTheme.text_1}
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
