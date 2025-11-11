// project/src/modules/CustomerProducts/ProductView/ProductView.tsx
"use client";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "../../../contexts/authContext";
import React from "react";
import "react-datepicker/dist/react-datepicker.css";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import ProductImages from "./ProductImages";
import {
  FaChevronDown,
  FaChevronLeft,
  FaChevronUp,
  FaPlus,
} from "react-icons/fa6";
import { ProductFormData, productToForm } from "@/util/schemas/productSchema";
import {
  useProductForm,
  useProductFormSubmit,
} from "@/hooks/forms/useProductForm";
import ProductInputField from "../Forms/InputField";
import {
  Media,
  MediaLink,
  Customer,
  Job,
  JobDefinition,
  Product,
} from "@open-dream/shared";
import CustomerTag from "@/modules/components/ProductCard/CustomerTag";
import RenderedImage from "@/modules/components/ProductCard/RenderedImage";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useModal1Store } from "@/store/useModalStore";
import CustomerSelection from "@/modules/components/Customers/CustomerSelection";
import { IoImagesOutline } from "react-icons/io5";
import { IoImageOutline } from "react-icons/io5";
import { getCardStyle, getInnerCardStyle } from "@/styles/themeStyles";
import ProductJobs from "./ProductJobs";
import ProductJobCard from "./ProductJobCard/ProductJobCard";
import { useLeftBarOpenStore } from "@/store/useLeftBarOpenStore";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { useRouting } from "@/hooks/useRouting";
import { useFormInstanceStore } from "@/store/formInstanceStore";
import { useWatch } from "react-hook-form";
import { useMedia } from "@/hooks/useMedia";
import { useCurrentTheme } from "@/hooks/useTheme";
import UploadModal from "@/components/Upload/Upload";
import MediaPlayer from "@/modules/MediaModule/MediaPlayer";

const ProductView = ({ serialNumber }: { serialNumber?: string }) => {
  const { currentUser } = useContext(AuthContext);
  const { history } = useRouting();
  const { productsData, media, mediaLinks, customers, jobs, jobDefinitions } =
    useContextQueries();
  const { uploadProductImages } = useMedia();
  const { screen, setUploadContext, addingProduct, setAddingProduct } =
    useUiStore();
  const {
    currentProduct,
    setCurrentProductData,
    currentProductImages,
    setCurrentProductImages,
    originalProductImages,
    setOriginalProductImages,
    currentMediaSelected,
    setCurrentMediaSelected,
  } = useCurrentDataStore();
  const currentTheme = useCurrentTheme();
  const { screenClick, screenClickAction } = useRouting();
  const leftBarOpen = useLeftBarOpenStore((state: any) => state.leftBarOpen);

  const [imageDisplayed, setImageDisplayed] = useState<Media | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoTime, setVideoTime] = useState({ current: 0, duration: 0 });
  const [imageEditorOpen, setImageEditorOpen] = useState<boolean>(false);
  const [descriptionEditorOpen, setDescriptionEditorOpen] =
    useState<boolean>(false);
  const [noteEditorOpen, setNoteEditorOpen] = useState<boolean>(false);

  const modal1 = useModal1Store((state: any) => state.modal1);
  const setModal1 = useModal1Store((state: any) => state.setModal1);

  const { onProductFormSubmit } = useProductFormSubmit();
  const productForm = useProductForm(currentProduct);
  const { registerForm, unregisterForm } = useFormInstanceStore();
  const { handleSubmit } = productForm;

  useEffect(() => {
    const formKey = "product";
    registerForm(formKey, productForm);
    return () => unregisterForm(formKey);
  }, [productForm, registerForm, unregisterForm]);

  // const serialInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (addingProduct) {
      // serialInputRef.current?.focus();
      setCurrentProductImages([]);
      setOriginalProductImages([]);
    }
  }, [addingProduct]);

  const customerId = useWatch({
    control: productForm.control,
    name: "customer_id",
  });
  const description = useWatch({
    control: productForm.control,
    name: "description",
  });

  const initialFormState = useRef<Partial<ProductFormData> | null>(null);

  const matchedProduct = useMemo(() => {
    return productsData.find(
      (product: Product) => product.serial_number === serialNumber
    );
  }, [productsData]);

  const matchedCustomer = useMemo(() => {
    return (
      customers.find((customer: Customer) => customer.id === customerId) || null
    );
  }, [productsData, customers, serialNumber, customerId]);

  const productJobs = useMemo(() => {
    if (!matchedProduct || !matchedProduct.id) return [];
    return jobs.filter((job: Job) => job.product_id === matchedProduct.id);
  }, [jobs, matchedProduct]);

  useEffect(() => {
    if (
      serialNumber &&
      screen !== "edit-customer-product" &&
      history &&
      history.length === 0
    ) {
      screenClick("edit-customer-product", `/products/${serialNumber}`);
    }
  }, [serialNumber, screen, history]);

  useEffect(() => {
    if (!addingProduct && serialNumber && productsData?.length) {
      const matchedProduct = productsData.find(
        (product: Product) => product.serial_number === serialNumber
      );
      if (!matchedProduct) {
        console.warn("No product found for serial number:", serialNumber);
        return;
      }
      const formDefaults: Partial<ProductFormData> = {
        ...matchedProduct,
        name:
          matchedProduct.name && matchedProduct.name.length >= 1
            ? matchedProduct.name
            : "",
        serial_number: matchedProduct.serial_number
          ? matchedProduct.serial_number
          : "",
        customer_id: matchedProduct.customer_id
          ? matchedProduct.customer_id
          : null,
        length: matchedProduct.length ? Number(matchedProduct.length) : 0,
        width: matchedProduct.width ? Number(matchedProduct.width) : 0,
        height: matchedProduct.height ? Number(matchedProduct.height) : 0,
      };
      initialFormState.current = formDefaults;
      productForm.reset(productToForm(matchedProduct));
    }
  }, [addingProduct, serialNumber, productsData, productForm.reset]);

  const productsDataRef = useRef(productsData);
  useEffect(() => {
    productsDataRef.current = productsData;
  }, [productsData]);

  const originalProductImagesRef = useRef(originalProductImages);
  useEffect(() => {
    originalProductImagesRef.current = originalProductImages;
  }, [originalProductImages]);

  const currentProductImagesRef = useRef(currentProductImages);
  useEffect(() => {
    currentProductImagesRef.current = currentProductImages;
  }, [currentProductImages]);

  useEffect(() => {
    if (!mediaLinks) return;

    const currentProducts = productsDataRef.current;
    const currentProductItem = currentProducts.find(
      (product: Product) => product.serial_number === serialNumber
    );

    if (!currentProductItem) return;

    const loadedLinks = mediaLinks.filter(
      (link: MediaLink) =>
        link.entity_id === currentProductItem.id &&
        link.entity_type === "product"
    );

    const current = currentProductImagesRef.current;
    const original = originalProductImagesRef.current;

    const currentChanged =
      JSON.stringify(loadedLinks) !== JSON.stringify(current);
    const originalChanged =
      JSON.stringify(loadedLinks) !== JSON.stringify(original);

    if (currentChanged) {
      setCurrentProductImages(loadedLinks);
    }

    if (originalChanged) {
      setOriginalProductImages(loadedLinks);
    }
  }, [
    serialNumber,
    mediaLinks,
    setCurrentProductImages,
    setOriginalProductImages,
  ]);

  useEffect(() => {
    if (currentProductImages && currentProductImages.length) {
      const matchedMedia = media.find(
        (item: Media) => item.id === currentProductImages[0].media_id
      );
      setImageDisplayed(matchedMedia ?? null);
    }
  }, [media, currentProductImages]);

  const handleBackButton = async () => {
    await screenClick("customer-products", "/products");
    setCurrentProductData(null);
    setAddingProduct(false);
  };

  const handleProductsClick = async () => {
    await screenClick("customer-products", "/products");
    setCurrentProductData(null);
    setAddingProduct(false);
  };

  const imagesChanged =
    JSON.stringify(currentProductImages) !==
    JSON.stringify(originalProductImages);

  const handleCancelFormChanges = () => {
    if (imagesChanged && originalProductImages) {
      setCurrentProductImages(originalProductImages);
    }
    if (
      initialFormState.current &&
      productForm &&
      productForm.formState.isDirty
    ) {
      productForm.reset(initialFormState.current);
    }
  };

  const handleAddJobClick = () => {
    setModal1({
      ...modal1,
      open: !modal1.open,
      showClose: true,
      offClickClose: true,
      width: "w-[90vw] md:w-[80vw]",
      maxWidth: "md:max-w-[1000px]",
      aspectRatio: "aspect-[2/2.1] md:aspect-[3/2]",
      borderRadius: "rounded-[15px] md:rounded-[20px]",
      content: (
        <ProductJobs
          product={matchedProduct ?? null}
          customerId={customerId ?? null}
        />
      ),
    });
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    await onProductFormSubmit(data);
    await screenClickAction(
      "edit-customer-product",
      `/products/${data.serial_number}`
    );
  };

  const onUploadClick = () => {
    setUploadContext({
      visible: true,
      multiple: true,
      usage: "product",
      folder_id: null,
      onUploaded: async (uploads: Media[], files: File[]) => {
        console.log(uploads);
        await uploadProductImages(uploads, serialNumber ?? null);
        setImageEditorOpen(true);
      },
    });
  };

  if (!currentUser) return null;

  if (!addingProduct && serialNumber && productsData?.length) {
    const productExists = productsData.some(
      (p) => p.serial_number === serialNumber
    );
    if (!productExists) {
      return (
        <div
          className="text-center text-xl py-20"
          style={{ color: currentTheme.text_1 }}
        >
          No product found for serial number: <strong>{serialNumber}</strong>
        </div>
      );
    }
  }

  return (
    <div className="w-[100%] h-[100%] overflow-scroll hide-scrollbar">
      {currentMediaSelected && <MediaPlayer />}

      <div
        className={`max-w-4xl mx-auto px-[17px] pt-[18px] pb-[50px] flex flex-col`}
      >
        <div className="flex flex-row gap-[13px] ml-[3px]">
          <div
            onClick={handleBackButton}
            style={{
              backgroundColor: currentTheme.background_2,
            }}
            className="w-[40px] h-[40px] rounded-[20px] flex items-center justify-center pr-[2px] pb-[1px] dim hover:brightness-75 cursor-pointer"
          >
            <FaChevronLeft
              size={21}
              className="opacity-[0.6]"
              color={currentTheme.text_1}
            />
          </div>

          {addingProduct ? (
            <h1 className="text-3xl font-[500] mb-[24px]">Add Product</h1>
          ) : (
            <div
              className="ml-[2px] flex flex-row gap-[10px] text-[25px] font-[400] mb-[20px] opacity-[0.5]"
              style={{
                color: currentUser.theme === "dark" ? "#bbb" : "black",
              }}
            >
              <div
                onClick={handleProductsClick}
                className="cursor-pointer dim hover:brightness-75"
              >
                Products
              </div>

              <h1 className="hidden [@media(min-width:480px)]:block">/</h1>

              <div className="hidden [@media(min-width:480px)]:block cursor-pointer dim hover:brightness-75 text-[23px] mt-[2px]">
                {serialNumber}
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="mb-[2px] flex flex-col w-[100%] rounded-[15px] px-[35px] py-[30px]"
          style={getCardStyle(currentUser.theme, currentTheme)}
        >
          <div className="w-[100%] flex gap-[18px] flex-col min-[580px]:flex-row">
            <div
              className={`flex flex-col min-[500px]:max-w-[250px] w-[100%] min-[580px]:w-[160px] min-[650px]:w-[220px] min-[650px]:min-w-[220px] ${
                leftBarOpen
                  ? "min-[1024px]:w-[180px] min-[1024px]:min-w-[180px] min-[1100px]:w-[220px] min-[1100px]:min-w-[220px]"
                  : ""
              } `}
            >
              {currentProductImages.length >= 1 ? (
                <div
                  onClick={() => {
                    setCurrentMediaSelected(imageDisplayed);
                  }}
                  style={{
                    backgroundColor: currentTheme.background_2,
                  }}
                  className="cursor-pointer hover:brightness-[86%] dim w-[100%] aspect-[1/1] rounded-[10px]"
                >
                  {imageDisplayed && (
                    <RenderedImage media={imageDisplayed} rounded={true} />
                  )}
                </div>
              ) : (
                <div
                  onClick={onUploadClick}
                  style={{
                    backgroundColor: currentTheme.background_2,
                  }}
                  className="flex justify-center items-center cursor-pointer hover:brightness-[86%] dim w-[100%] aspect-[1/1] rounded-[10px]"
                >
                  <FaPlus className="w-[25px] h-[25px] opacity-[0.5]" />
                </div>
              )}

              <div className="mt-[11px] w-[100%] h-[50px] flex flex-row relative">
                <div className="min-w-[61px] h-[50px] flex items-center">
                  <div
                    onClick={() => {
                      setImageEditorOpen((prev) => !prev);
                    }}
                    className="dim hover:brightness-90 cursor-pointer w-[51px] h-[51px] rounded-[10px] text-[15px] flex items-center justify-center font-[500]"
                    style={{
                      backgroundColor: currentTheme.background_2,
                    }}
                  >
                    <IoImagesOutline
                      className="w-[23px] h-[23px] opacity-[0.4]"
                      color={currentTheme.text_1}
                    />
                  </div>
                </div>
                <div
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  className="w-[100%] h-[100%] overflow-x-auto flex flex-row"
                >
                  <ProductImages
                    imageEditorOpen={imageEditorOpen}
                    setImageDisplayed={setImageDisplayed}
                    singleRow={true}
                  />
                </div>
              </div>
            </div>
            {imageEditorOpen ? (
              <div className="w-[100%] h-auto flex flex-col">
                <div className="flex items-center flex-row justify-between mb-[7px]">
                  <div className="flex items-center flex-row gap-[12px] mt-[2px] mb-[8px]">
                    <div
                      onClick={() => {
                        setImageEditorOpen(false);
                      }}
                      style={{
                        backgroundColor: currentTheme.background_2,
                      }}
                      className="w-[34px] h-[34px] rounded-[20px] flex items-center justify-center pr-[2px] pb-[1px] dim hover:brightness-90 cursor-pointer"
                    >
                      <FaChevronLeft
                        size={18}
                        color={currentTheme.text_1}
                        className="opacity-[0.5] ml-[1.5px]"
                      />
                    </div>
                    <div className="text-[23px] font-[600] mt-[-2.5px]">
                      Images
                    </div>
                  </div>
                  <div
                    onClick={onUploadClick}
                    style={{
                      backgroundColor: currentTheme.background_2,
                    }}
                    className="pl-[17px] pr-[22px] py-[5px] rounded-full gap-[8px] flex items-center justify-center dim hover:brightness-90 cursor-pointer"
                  >
                    <IoImageOutline
                      size={20}
                      color={currentTheme.text_1}
                      className="opacity-[0.8] ml-[1.5px]"
                    />
                    <div className="text-[16px] font-[500] opacity-[0.8]">
                      Upload
                    </div>
                  </div>
                </div>
                <ProductImages
                  imageEditorOpen={imageEditorOpen}
                  setImageDisplayed={setImageDisplayed}
                  singleRow={false}
                />
              </div>
            ) : (
              <div className="flex flex-1 flex-col">
                <ProductInputField
                  label="Name"
                  name="name"
                  register={productForm.register}
                  error={productForm.formState.errors.name?.message}
                  disabled={false}
                  className="ml-[3px] mt-[-3px] w-[100%] font-bold text-[25px]"
                  inputType={"input"}
                />

                <div
                  className={`flex flex-col w-[100%] ${
                    descriptionEditorOpen
                      ? "h-[260px] min-[580px]:h-[100%]"
                      : "max-w-[331px]"
                  }`}
                >
                  <div className="mt-[3px] mb-[10px] flex items-center font-[500] w-max text-[17px]">
                    <p className="opacity-[0.5] mr-[10px]">ID</p>
                    <div
                      style={{
                        backgroundColor: currentTheme.background_2,
                      }}
                      className="rounded-[6px] py-[2px] px-[10px]"
                    >
                      <ProductInputField
                        label="Serial Number"
                        name="serial_number"
                        register={productForm.register}
                        error={
                          productForm.formState.errors.serial_number?.message
                        }
                        disabled={!addingProduct}
                        className="text-[15px] font-[500] w-max mb-[1px] opacity-[0.5]"
                        inputType="input"
                        onInput={(e) => {
                          e.currentTarget.value = e.currentTarget.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, "")
                            .slice(0, 20);
                        }}
                      />
                    </div>
                  </div>

                  <div
                    className={`${
                      descriptionEditorOpen ? "h-[100%]" : "mb-[10px]"
                    } flex flex-row items-center font-[500] w-[100%] relative text-[17px] mt-[-1px]`}
                  >
                    {!descriptionEditorOpen && (
                      <p className="opacity-[0.5] mr-[10px]">Description</p>
                    )}
                    <div
                      style={{
                        backgroundColor: currentTheme.background_2,
                      }}
                      onClick={() => {
                        if (!descriptionEditorOpen) {
                          setDescriptionEditorOpen(true);
                        }
                      }}
                      className={`${
                        !descriptionEditorOpen
                          ? "cursor-pointer dim hover:brightness-[85%] py-[2px] px-[10px]"
                          : "px-[4px] h-[100%]"
                      } rounded-[6px] min-h-[24px] flex flex-1 min-w-0`}
                    >
                      {!descriptionEditorOpen ? (
                        <div className="opacity-[0.5] truncate w-[100%] min-h-[24px] text-[16px]">
                          {description && description.length > 0
                            ? description
                            : "..."}
                        </div>
                      ) : (
                        <textarea
                          {...productForm.register("description")}
                          className="w-[calc(100%-40px)] text-[15px] opacity-[0.5] outline-none border-none resize-none input rounded-[7px] px-[12px] py-[9px]"
                          placeholder="Description..."
                        />
                      )}
                      {descriptionEditorOpen && (
                        <div
                          onClick={() => setDescriptionEditorOpen(false)}
                          className="flex justify-center items-center cursor-pointer hover:brightness-75 dim w-[36px] h-[26px] right-[10px] top-[10px] absolute z-[300]"
                        >
                          <FaChevronUp className="opacity-[0.2]" size={20} />
                        </div>
                      )}
                    </div>
                  </div>

                  {!descriptionEditorOpen && (
                    <div className="flex flex-col w-[100%]">
                      <div className="w-[100%] flex flex-row items-center mb-[10px]">
                        <p className="opacity-[0.5] font-[500] text-[17px] mr-[11px] mt-[-2px]">
                          Make
                        </p>
                        <div
                          style={{
                            backgroundColor: currentTheme.background_2,
                          }}
                          className="rounded-[6px] py-[3px] px-[10px] w-[100%]"
                        >
                          <ProductInputField
                            label="Make"
                            name="make"
                            register={productForm.register}
                            error={productForm.formState.errors.make?.message}
                            className="text-[15px] font-[500] opacity-[0.5] w-[100%] truncate"
                            inputType={"input"}
                          />
                        </div>
                      </div>

                      <div className="flex items-center w-[100%] mb-[10px]">
                        <p className="opacity-[0.5] font-[500] text-[17px] mr-[11px] mt-[-2px]">
                          Model
                        </p>
                        <div
                          style={{
                            backgroundColor: currentTheme.background_2,
                          }}
                          className="rounded-[6px] py-[3px] px-[10px] w-[100%]"
                        >
                          <ProductInputField
                            label="Model"
                            name="model"
                            register={productForm.register}
                            error={productForm.formState.errors.model?.message}
                            className="text-[15px] font-[500] opacity-[0.5]"
                            inputType={"input"}
                          />
                        </div>
                      </div>

                      <div
                        className={`flex flex-row gap-[5px] items-center mb-[10px]`}
                      >
                        <p className="opacity-[0.5] font-[500] text-[17px] mr-[4px] mt-[-2px] min-w-[75px]">
                          L x W x H
                        </p>
                        <div className="w-[100%] flex flex-row">
                          <div
                            style={{
                              backgroundColor: currentTheme.background_2,
                            }}
                            className="rounded-[6px] py-[3px] px-[10px] w-[calc((100%-50px)*0.333)]"
                          >
                            <ProductInputField
                              label="Length (in)"
                              name="length"
                              placeholder="L"
                              inputMode="decimal"
                              pattern="^\d+(\.\d{0,2})?$"
                              inputType={"input"}
                              onInput={(e) => {
                                let value = e.currentTarget.value;
                                value = value.replace(/[^0-9.]/g, "");
                                const parts = value.split(".");
                                if (parts.length > 2) {
                                  value = parts[0] + "." + parts[1];
                                }
                                if (parts[1]?.length > 2) {
                                  parts[1] = parts[1].slice(0, 2);
                                  value = parts[0] + "." + parts[1];
                                }
                                e.currentTarget.value = value;
                              }}
                              register={productForm.register}
                              registerOptions={{
                                required: "Length is required",
                                validate: (value) =>
                                  /^\d+(\.\d{1,2})?$/.test(String(value)) ||
                                  "Max 2 decimal places",
                                setValueAs: (v) => {
                                  const num = parseFloat(v);
                                  return isNaN(num) ? undefined : num;
                                },
                              }}
                              error={
                                productForm.formState.errors.length?.message
                              }
                              className="text-[15px] font-[500] opacity-[0.5]"
                            />
                          </div>

                          <div className="opacity-50 text-[14px] w-[25px] flex items-center justify-center">
                            X
                          </div>

                          <div
                            style={{
                              backgroundColor: currentTheme.background_2,
                            }}
                            className="rounded-[6px] py-[3px] px-[10px] w-[calc((100%-50px)*0.333)]"
                          >
                            <ProductInputField
                              label="Width (in)"
                              name="width"
                              placeholder="W"
                              inputMode="decimal"
                              pattern="^\d+(\.\d{0,2})?$"
                              inputType={"input"}
                              onInput={(e) => {
                                let value = e.currentTarget.value;
                                value = value.replace(/[^0-9.]/g, "");
                                const parts = value.split(".");
                                if (parts.length > 2) {
                                  value = parts[0] + "." + parts[1];
                                }
                                if (parts[1]?.length > 2) {
                                  parts[1] = parts[1].slice(0, 2);
                                  value = parts[0] + "." + parts[1];
                                }
                                e.currentTarget.value = value;
                              }}
                              register={productForm.register}
                              registerOptions={{
                                required: "Width is required",
                                validate: (value) =>
                                  /^\d+(\.\d{1,2})?$/.test(String(value)) ||
                                  "Max 2 decimal places",
                                setValueAs: (v) => {
                                  const num = parseFloat(v);
                                  return isNaN(num) ? undefined : num;
                                },
                              }}
                              error={
                                productForm.formState.errors.width?.message
                              }
                              className="text-[15px] font-[500] opacity-[0.5]"
                            />
                          </div>

                          <div className="opacity-50 text-[14px] w-[25px] flex items-center justify-center">
                            X
                          </div>

                          <div
                            style={{
                              backgroundColor: currentTheme.background_2,
                            }}
                            className="rounded-[6px] py-[3px] px-[10px] w-[calc((100%-50px)*0.333)]"
                          >
                            <ProductInputField
                              label="Height (in)"
                              placeholder="H"
                              name="height"
                              inputMode="decimal"
                              pattern="^\d+(\.\d{0,2})?$"
                              inputType={"input"}
                              onInput={(e) => {
                                let value = e.currentTarget.value;
                                value = value.replace(/[^0-9.]/g, "");
                                const parts = value.split(".");
                                if (parts.length > 2) {
                                  value = parts[0] + "." + parts[1];
                                }
                                if (parts[1]?.length > 2) {
                                  parts[1] = parts[1].slice(0, 2);
                                  value = parts[0] + "." + parts[1];
                                }
                                e.currentTarget.value = value;
                              }}
                              register={productForm.register}
                              registerOptions={{
                                required: "Height is required",
                                validate: (value) =>
                                  /^\d+(\.\d{1,2})?$/.test(String(value)) ||
                                  "Max 2 decimal places",
                                setValueAs: (v) => {
                                  const num = parseFloat(v);
                                  return isNaN(num) ? undefined : num;
                                },
                              }}
                              error={
                                productForm.formState.errors.height?.message
                              }
                              className="text-[15px] font-[500] opacity-[0.5]"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row">
                        <CustomerTag
                          productCustomer={matchedCustomer}
                          oneSize={true}
                          product={matchedProduct ?? null}
                        />

                        {matchedCustomer && (
                          <div
                            onClick={() => {
                              setModal1({
                                ...modal1,
                                open: !modal1.open,
                                showClose: true,
                                offClickClose: true,
                                width: "w-[90vw] md:w-[80vw]",
                                maxWidth: "md:max-w-[1000px]",
                                aspectRatio: "aspect-[2/2.1] md:aspect-[3/2]",
                                borderRadius:
                                  "rounded-[15px] md:rounded-[20px]",
                                content: (
                                  <CustomerSelection
                                    product={matchedProduct ?? null}
                                  />
                                ),
                              });
                            }}
                            className="h-[100%] px-[1px] flex items-center cursor-pointer hover:brightness-75 dim"
                          >
                            <BsThreeDotsVertical
                              size={22}
                              className="opacity-[0.2]"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div
            className={`mt-[11px] ${
              imageEditorOpen || descriptionEditorOpen ? "hidden" : "block"
            } min-[580px]:block`}
          >
            <div
              className={`relative rounded-[8px] ${
                noteEditorOpen ? "h-[150px]" : "h-[57px]"
              } transition-all duration-200 ease-in-out will-change-transform`}
              style={{
                backgroundColor: currentTheme.background_2,
              }}
            >
              <textarea
                {...productForm.register("note")}
                className="w-[calc(100%-45px)] h-[100%] text-[15px] opacity-[0.5] outline-none border-none resize-none input rounded-[7px] px-[15px] py-[8px]"
                placeholder="Notes..."
              />

              <div
                onClick={() => setNoteEditorOpen((prev) => !prev)}
                className="flex justify-center items-center cursor-pointer hover:brightness-75 dim w-[36px] h-[26px] right-[10px] top-[6px] absolute z-[300]"
              >
                {noteEditorOpen ? (
                  <FaChevronUp className="opacity-[0.2]" size={20} />
                ) : (
                  <FaChevronDown className="opacity-[0.2]" size={20} />
                )}
              </div>
            </div>

            <div className="flex flex-row gap-[16px]">
              {(productForm.formState.isDirty || imagesChanged) && (
                <button
                  type="submit"
                  className="mt-[12px] cursor-pointer dim hover:brightness-75 w-[200px] h-[40px] rounded-[8px] text-white font-semibold"
                  style={{
                    backgroundColor: currentTheme.app_color_1,
                  }}
                >
                  <div className="flex items-center justify-center">Save</div>
                </button>
              )}

              {(productForm.formState.isDirty || imagesChanged) && (
                <div
                  onClick={handleCancelFormChanges}
                  className="mt-[12px] cursor-pointer dim hover:brightness-75 w-[200px] h-[40px] rounded-[8px] text-white font-semibold flex items-center justify-center"
                  style={{
                    backgroundColor:
                      currentUser.theme === "dark"
                        ? currentTheme.background_4
                        : "#bbb",
                  }}
                >
                  Cancel
                </div>
              )}
            </div>
          </div>
        </form>

        {matchedProduct &&
          matchedProduct.id &&
          productJobs &&
          productJobs.length > 0 &&
          productJobs.map((productJob: Job, index: number) => {
            const matchedDefinition = jobDefinitions.find(
              (definition: JobDefinition) =>
                definition.id === productJob.job_definition_id
            );
            if (!matchedDefinition) return;
            return (
              <div
                key={index}
                className={`w-[100%] ${
                  index === 0 ? "mt-[12px]" : "mt-[34px]"
                }`}
              >
                <ProductJobCard
                  matchedProduct={matchedProduct}
                  matchedDefinition={matchedDefinition}
                  productJob={productJob}
                />
              </div>
            );
          })}

        {screen === "edit-customer-product" && matchedProduct && (
          <div className="w-[100%] mt-[12px] flex justify-end">
            <div
              style={getInnerCardStyle(currentUser.theme, currentTheme)}
              className="cursor-pointer hover:brightness-90 dim py-[6px] pl-[16px] pr-[20px] rounded-[10px] flex items-center justify-center gap-[8px] flex-row"
              onClick={handleAddJobClick}
            >
              <div
                style={{
                  backgroundColor: currentTheme.background_2_2,
                }}
                className="opacity-[0.8] w-[22px] h-[22px] rounded-[20px] flex items-center justify-center"
              >
                <FaPlus
                  size={13}
                  color={currentTheme.text_1}
                  className="opacity-[0.8]"
                />
              </div>
              <div className="text-[15px] font-[500] opacity-[0.8] mt-[-1px]">
                Add Job
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export type { ProductFormData };
export default ProductView;
