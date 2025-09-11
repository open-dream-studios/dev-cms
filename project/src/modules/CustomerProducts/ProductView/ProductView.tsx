// project/src/screens/Inventory/ProductPage/ProductView.tsx
"use client";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "../../../contexts/authContext";
import React from "react";
import { useAppContext } from "@/contexts/appContext";
import { appTheme } from "@/util/appTheme";
import "react-datepicker/dist/react-datepicker.css";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import ProductImages from "./ProductImages";
import { FaChevronLeft, FaPlus } from "react-icons/fa6";
import UploadModal, {
  CloudinaryUpload,
} from "../../../components/Upload/Upload";
import { ProductFormData } from "@/util/schemas/productSchema";
import { useProductForm } from "@/hooks/useProductForm";
import ProductInputField from "../Forms/InputField";
import { useProjectContext } from "@/contexts/projectContext";
import { MediaInsert, MediaLink, TempMediaLink } from "@/types/media";
import { usePathname } from "next/navigation";
import { Customer } from "@/types/customers";
import CustomerTag from "@/modules/components/ProductCard/CustomerTag";
import RenderedImage from "@/modules/components/ProductCard/RenderedImage";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useModal1Store } from "@/store/useModalStore";
import CustomerSelection from "@/modules/components/Customers/CustomerSelection";

const ProductView = ({ serialNumber }: { serialNumber?: string }) => {
  const { currentUser } = useContext(AuthContext);
  const {
    setUploadPopup,
    productFormRef,
    handleProductFormSubmit,
    goToPrev,
    screen,
    screenClick,
    productImages,
    setProductImages,
    originalImagesRef,
    formRefs,
    screenHistoryRef,
  } = useAppContext();
  const { productsData, addMedia, refetchMedia, mediaLinks, customers } =
    useContextQueries();
  const { currentProjectId } = useProjectContext();
  const pathname = usePathname();

  const [imageView, setImageView] = useState<string | null>(null);
  const [imageDisplayed, setImageDisplayed] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoTime, setVideoTime] = useState({ current: 0, duration: 0 });

  const modal1 = useModal1Store((state: any) => state.modal1);
  const setModal1 = useModal1Store((state: any) => state.setModal1);

  const newProduct = useMemo(() => {
    return screen === "add-customer-product";
  }, [screen]);

  const form = useProductForm();
  const dateSold = form.watch("date_sold");
  const dateEntered = form.watch("date_entered");
  const jobType = form.watch("job_type");
  const customerId = form.watch("customer_id");

  useEffect(() => {
    if (
      pathname === "/products" &&
      screen === "add-customer-product" &&
      !serialNumber
    ) {
      setProductImages([]);
      setImageDisplayed(null);
      setImageView(null);
      originalImagesRef.current = [];
    }
  }, [serialNumber, screen, pathname]);

  useEffect(() => {
    if (
      serialNumber &&
      screen !== "edit-customer-product" &&
      screenHistoryRef.current &&
      screenHistoryRef.current.length <= 1
    ) {
      screenClick("edit-customer-product", `/products/${serialNumber}`);
    }
  }, [serialNumber, screen]);

  useEffect(() => {
    if (productFormRef) {
      productFormRef.current = form;
    }
  }, [form, productFormRef, formRefs]);

  useEffect(() => {
    if (!newProduct && serialNumber && productsData?.length) {
      const matchedProduct = productsData.find(
        (product) => product.serial_number === serialNumber
      );
      if (!matchedProduct) {
        console.warn("No product found for serial number:", serialNumber);
        return;
      }
      const formDefaults: Partial<ProductFormData> = {
        ...matchedProduct,
        customer_id: matchedProduct.customer_id
          ? matchedProduct.customer_id
          : undefined,
        date_sold: matchedProduct.date_sold
          ? new Date(matchedProduct.date_sold)
          : undefined,
        date_entered: matchedProduct.date_entered
          ? new Date(matchedProduct.date_entered)
          : undefined,
        price: matchedProduct.price ? Number(matchedProduct.price) : 0,
        length: matchedProduct.length ? Number(matchedProduct.length) : 0,
        width: matchedProduct.width ? Number(matchedProduct.width) : 0,
      };
      form.reset(formDefaults);
    }
  }, [newProduct, serialNumber, productsData, form.reset]);

  const matchedProduct = useMemo(() => {
    return productsData.find(
      (product) => product.serial_number === serialNumber
    );
  }, [productsData]);

  const matchedCustomer = useMemo(() => {
    const product = productsData.find(
      (product) => product.serial_number === serialNumber
    );
    if (product) {
      return customers.find((customer: Customer) => customer.id === customerId);
    }
    return null;
  }, [productsData, customers, serialNumber, customerId]);

  useEffect(() => {
    if (matchedProduct) {
      const initialImages = mediaLinks.filter(
        (link: MediaLink) =>
          link.entity_id === matchedProduct.id && link.entity_type === "product"
      );

      const originalImages = () => {
        const tempImages = productImages.filter((img) => img.isTemp);
        const merged = [...initialImages, ...tempImages];

        // Deduplicate by media_id (or URL if no media_id)
        const seen = new Set<string>();
        return merged.filter((img) => {
          const key = img.media_id ? `media-${img.media_id}` : `url-${img.url}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      };
      const newProductImages = originalImages();
      setProductImages(newProductImages);
      originalImagesRef.current = newProductImages;
      if (newProductImages.length >= 1) {
        setImageDisplayed(newProductImages[0].url);
      }
    }
  }, [mediaLinks, matchedProduct]);

  if (!currentUser) return null;

  if (!newProduct && serialNumber && productsData?.length) {
    const productExists = productsData.some(
      (p) => p.serial_number === serialNumber
    );
    if (!productExists) {
      return (
        <div
          className="text-center text-xl py-20"
          style={{ color: appTheme[currentUser.theme].text_1 }}
        >
          No product found for serial number: <strong>{serialNumber}</strong>
        </div>
      );
    }
  }

  const handleBackButton = async () => {
    await goToPrev();
  };

  const handleProductsClick = async () => {
    await screenClick("customer-products", "/products");
  };

  const imagesChanged =
    JSON.stringify(productImages) !== JSON.stringify(originalImagesRef.current);

  const onFormSubmitButton = async (data: ProductFormData) => {
    await handleProductFormSubmit(data);
    if (data.serial_number) {
      await screenClick(
        "edit-customer-product",
        `/products/${data.serial_number}`
      );
    }
  };

  if (!currentUser) return null;

  return (
    <form
      onSubmit={form.handleSubmit(onFormSubmitButton)}
      className="w-[100%] h-[100%] overflow-scroll"
    >
      <UploadModal
        onClose={() => setUploadPopup(false)}
        multiple={true}
        onUploaded={async (uploadObjects: CloudinaryUpload[]) => {
          if (!currentProjectId) return;
          const media_items = uploadObjects.map((upload: CloudinaryUpload) => {
            return {
              project_idx: currentProjectId,
              public_id: upload.public_id,
              url: upload.url,
              type: "image",
              folder_id: null,
              media_usage: "product",
            } as MediaInsert;
          });
          const mediaObjects = await addMedia(media_items);
          setProductImages((prev) => {
            const startIndex = prev.length;
            const newImages: TempMediaLink[] = mediaObjects.map((m, index) => ({
              entity_type: "product",
              entity_id: null,
              media_id: m.id,
              url: m.url,
              ordinal: startIndex + index,
              isTemp: true,
            }));
            return [...prev, ...newImages];
          });
          refetchMedia();
        }}
      />
      {imageView && (
        <div
          className="fixed z-[990] top-0 left-0 w-[100vw] display-height flex items-center justify-center"
          style={{
            backgroundColor: appTheme[currentUser.theme].background_1,
          }}
          onClick={() => setImageView("")}
        >
          {/\.(mp4|mov)$/i.test(imageView) ? (
            <div className="relative max-w-[100%] max-h-[100%]">
              <video
                ref={videoRef}
                src={imageView}
                className="object-contain max-w-[100%] max-h-[90vh]"
                playsInline
                loop
                autoPlay
                onClick={() => setImageView("")}
                onTimeUpdate={(e) => {
                  const v = e.currentTarget;
                  setVideoTime({
                    current: v.currentTime,
                    duration: v.duration,
                  });
                }}
              />
              <div
                className="absolute left-0 right-0 bottom-4 px-6"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="range"
                  min={0}
                  max={videoTime.duration || 0}
                  step={0.01}
                  value={videoTime.current || 0}
                  onChange={(e) => {
                    const newTime = parseFloat(e.target.value);
                    if (videoRef.current)
                      videoRef.current.currentTime = newTime;
                    setVideoTime((prev) => ({ ...prev, current: newTime }));
                  }}
                  className="w-full appearance-none bg-transparent cursor-pointer"
                  style={{
                    WebkitAppearance: "none",
                    appearance: "none",
                  }}
                />
                <style jsx>{`
                  input[type="range"] {
                    height: 4px;
                  }
                  input[type="range"]::-webkit-slider-runnable-track {
                    height: 4px;
                    background: #ccc;
                    border-radius: 2px;
                  }
                  input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 14px;
                    width: 14px;
                    border-radius: 50%;
                    background: #d1d5db;
                    margin-top: -5px; /* centers thumb vertically */
                    transition: background 0.2s ease;
                  }
                  input[type="range"]::-webkit-slider-thumb:hover {
                    background: #d1d5db;
                  }
                  input[type="range"]::-moz-range-track {
                    height: 4px;
                    background: #ccc;
                    border-radius: 2px;
                  }
                  input[type="range"]::-moz-range-thumb {
                    height: 14px;
                    width: 14px;
                    border-radius: 50%;
                    background: #d1d5db;
                    border: none;
                    transition: background 0.2s ease;
                  }
                  input[type="range"]::-moz-range-thumb:hover {
                    background: #d1d5db;
                  }
                `}</style>
              </div>
            </div>
          ) : (
            <img
              src={imageView}
              className="object-cover max-w-[100%] max-h-[100%]"
            />
          )}
        </div>
      )}
      {matchedProduct && (
        <div
          className={`max-w-4xl mx-auto px-[10px] pt-[28px] pb-[60px] rounded-2xl`}
        >
          <div className="flex flex-row gap-[13px]">
            {screenHistoryRef.current &&
              screenHistoryRef.current.length >= 2 && (
                <div
                  onClick={handleBackButton}
                  style={{
                    backgroundColor: appTheme[currentUser.theme].background_2,
                  }}
                  className="w-[40px] h-[40px] rounded-[20px] flex items-center justify-center pr-[2px] pb-[1px] dim hover:brightness-75 cursor-pointer"
                >
                  <FaChevronLeft
                    size={21}
                    color={appTheme[currentUser.theme].text_1}
                  />
                </div>
              )}

            {newProduct && (
              <div className="">
                <h1 className="text-3xl font-[500] mb-[24px]">Add Product</h1>
              </div>
            )}

            {!newProduct && (
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

                <div className="hidden [@media(min-width:480px)]:block cursor-pointer dim hover:brightness-75 text-[23px] mt-[1px]">
                  {serialNumber}
                </div>
              </div>
            )}
          </div>

          <div
            className="flex flex-col w-[100%] rounded-[15px] px-[35px] py-[30px]"
            style={{
              backgroundColor: appTheme[currentUser.theme].background_2,
            }}
          >
            <div className="w-[100%] flex flex-row gap-[18px]">
              {productImages.length >= 1 ? (
                <div
                  onClick={() => {
                    setImageView(imageDisplayed);
                  }}
                  style={{
                    backgroundColor: appTheme[currentUser.theme].background_3,
                  }}
                  className="cursor-pointer hover:brightness-[86%] dim w-[43%] max-w-[250px] aspect-[1/1] rounded-[10px]"
                >
                  <RenderedImage
                    url={imageDisplayed ? imageDisplayed : productImages[0].url}
                  />
                </div>
              ) : (
                <div
                  onClick={() => {
                    setUploadPopup(true);
                  }}
                  style={{
                    backgroundColor: appTheme[currentUser.theme].background_3,
                  }}
                  className="flex justify-center items-center cursor-pointer hover:brightness-[86%] dim w-[130px] h-[130px] rounded-[10px]"
                >
                  <FaPlus className="w-[25px] h-[25px] opacity-[0.5]" />
                </div>
              )}
              <div className="flex flex-1 flex-col">
                <div className="flex flex-row mb-[6.5px] mt-[4px]">
                  {productFormRef.current &&
                    (jobType === "service" || jobType === "refurbishment") && (
                      <>
                        {matchedCustomer ? (
                          <CustomerTag productCustomer={matchedCustomer} />
                        ) : (
                          <CustomerTag productCustomer={null} />
                        )}
                      </>
                    )}
                  {matchedCustomer && jobType !== "resell" && (
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
                          borderRadius: "rounded-[15px] md:rounded-[20px]",
                          content: <CustomerSelection />,
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
                <ProductInputField
                  label="Name"
                  name="name"
                  register={form.register}
                  error={form.formState.errors.name?.message}
                  disabled={false}
                  className="ml-[3px] w-[100%] font-bold text-[25px]"
                  inputType={"input"}
                />

                <div
                  className={`${
                    jobType === "resell" ? "mt-[7px]" : "mt-[2px]"
                  } flex items-center ml-[3px] font-[500] w-max text-[17px] mb-[10px]`}
                >
                  <p className="opacity-[0.5] mr-[10px]">ID</p>
                  <div
                    style={{
                      backgroundColor: appTheme[currentUser.theme].background_3,
                    }}
                    className="rounded-[6px] py-[2px] px-[10px]"
                  >
                    <ProductInputField
                      label="Serial Number"
                      name="serial_number"
                      register={form.register}
                      error={form.formState.errors.serial_number?.message}
                      disabled={!newProduct}
                      className="text-[15px] font-[500] w-max mb-[1px] opacity-[0.5]"
                      inputType={"input"}
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9]/g, "")
                          .slice(0, 20);
                      }}
                    />
                  </div>
                </div>

                {jobType === "resell" && (
                  <div className="mt-[1px] flex items-center ml-[3px] font-[500] w-max text-[17px] mb-[7px]">
                    <p className="opacity-[0.5] mr-[10px]">Price</p>
                    <div
                      style={{
                        backgroundColor:
                          appTheme[currentUser.theme].background_3,
                      }}
                      className="rounded-[6px] py-[2px] px-[9px] flex flex-row gap-[2px]"
                    >
                      <p className="opacity-[0.5] font-[500] text-[15px]">$</p>
                      <ProductInputField
                        label="Price ($)"
                        name="price"
                        inputMode="decimal"
                        pattern="^\d+(\.\d{0,2})?$"
                        inputType={"input"}
                        onInput={(e) => {
                          let value = e.currentTarget.value;
                          value = value.replace(/[^0-9.]/g, "");
                          const parts = value.split(".");
                          if (parts.length > 2)
                            value = parts[0] + "." + parts[1];
                          if (parts[1]?.length > 2) {
                            parts[1] = parts[1].slice(0, 2);
                            value = parts[0] + "." + parts[1];
                          }
                          e.currentTarget.value = value;
                        }}
                        register={form.register}
                        registerOptions={{
                          required: "Price is required",
                          validate: (value) =>
                            /^\d+(\.\d{1,2})?$/.test(String(value)) ||
                            "Max 2 decimal places",
                          setValueAs: (v) =>
                            v === "" ? undefined : parseFloat(v),
                        }}
                        error={form.formState.errors.price?.message}
                        className="text-[15px] font-[500] w-max mb-[1px] opacity-[0.5]"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-[3px] ml-[3px]">
                  <ProductImages
                    productImages={productImages}
                    setProductImages={setProductImages}
                    setImageDisplayed={setImageDisplayed}
                  />
                </div>
              </div>
            </div>

            {/* <div className="w-[100%] flex flex-row gap-[10px]">
            <button
              onClick={() => {
                setUploadPopup(true);
              }}
              className="dim hover:brightness-75 cursor-pointer w-[170px] h-[35px] mb-[13px] gap-[6px] rounded-[6px] text-[15px] flex items-center justify-center font-[500]"
              style={{
                border: `0.5px solid ${
                  currentUser.theme === "light"
                    ? appTheme[currentUser.theme].text_1
                    : appTheme[currentUser.theme].text_4
                }`,
              }}
            >
              <IoIosAddCircleOutline
                className="w-[19px] h-[19px] mt-[1px]"
                color={appTheme[currentUser.theme].text_1}
              />
              Images
            </button>
            <button
              onClick={() => {
                const customer_id = window.prompt("customer id");
                if (customer_id) {
                  form.setValue("customer_id", parseFloat(customer_id), {
                    shouldDirty: true,
                  });
                }
              }}
              className="dim hover:brightness-75 cursor-pointer w-[170px] h-[35px] mb-[13px] gap-[6px] rounded-[6px] text-[15px] flex items-center justify-center font-[500]"
              style={{
                border: `0.5px solid ${
                  currentUser.theme === "light"
                    ? appTheme[currentUser.theme].text_1
                    : appTheme[currentUser.theme].text_4
                }`,
              }}
            >
              <UserCircle2Icon
                className="w-[19px] h-[19px] mt-[1px]"
                color={appTheme[currentUser.theme].text_1}
              />
              Customer
            </button>
          </div> */}

            <div className="mt-[14px] h-[40px] flex flex-row gap-[9px] items-center">
              <div className="font-[600] text-[16px] opacity-[0.5]">
                Job Type
              </div>
              <div
                style={{
                  backgroundColor: appTheme[currentUser.theme].background_3,
                }}
                className="rounded-full px-[5px]"
              >
                <ProductInputField
                  label="Job Type"
                  name="job_type"
                  register={form.register}
                  className="cursor-pointer hover:brightness-75 dim"
                  inputType={"dropdown"}
                  options={["service", "refurbishment", "resell"]}
                />
              </div>
            </div>

            <div className="mt-[10px]">
              <ProductInputField
                label="Description"
                name="description"
                register={form.register}
                error={form.formState.errors.description?.message}
                disabled={false}
                className="w-[100%] mb-[10px]"
                inputType={"textarea"}
                rows={3}
              />

              <div className="grid grid-cols-2 gap-[10px] gap-x-[5vw]">
                <ProductInputField
                  label="Make"
                  name="make"
                  register={form.register}
                  error={form.formState.errors.make?.message}
                  className="col-span-2 sm:col-span-1"
                  inputType={"input"}
                />

                <ProductInputField
                  label="Model"
                  name="model"
                  register={form.register}
                  error={form.formState.errors.model?.message}
                  className="col-span-2 sm:col-span-1"
                  inputType={"input"}
                />

                <ProductInputField
                  label="Repair Status"
                  name="repair_status"
                  register={form.register}
                  className="col-span-2 sm:col-span-1"
                  inputType={"dropdown"}
                  options={["In Progress", "Complete"]}
                />

                <ProductInputField
                  label="Sale Status"
                  name="sale_status"
                  register={form.register}
                  className="col-span-2 sm:col-span-1"
                  inputType={"dropdown"}
                  options={[
                    "Not Yet Posted",
                    "Awaiting Sale",
                    "Sold Awaiting Delivery",
                    "Delivered",
                  ]}
                />

                <ProductInputField
                  label="Length (in)"
                  name="length"
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
                  register={form.register}
                  registerOptions={{
                    required: "Length is required",
                    validate: (value) =>
                      /^\d+(\.\d{1,2})?$/.test(String(value)) ||
                      "Max 2 decimal places",
                    setValueAs: (v) => (v === "" ? undefined : parseFloat(v)),
                  }}
                  error={form.formState.errors.length?.message}
                  className="col-span-2 sm:col-span-1"
                />

                <ProductInputField
                  label="Width (in)"
                  name="width"
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
                  register={form.register}
                  registerOptions={{
                    required: "Width is required",
                    validate: (value) =>
                      /^\d+(\.\d{1,2})?$/.test(String(value)) ||
                      "Max 2 decimal places",
                    setValueAs: (v) => (v === "" ? undefined : parseFloat(v)),
                  }}
                  error={form.formState.errors.width?.message}
                  className="col-span-2 sm:col-span-1"
                />
              </div>

              <div className="flex flex-row">
                {!newProduct && (
                  <div className="mr-[25px] pointer-events-none">
                    <ProductInputField
                      label="Date Entered"
                      name="date_entered"
                      register={form.register}
                      className="mt-[12px] opacity-[0.5]"
                      inputType={"date"}
                      selected={dateEntered}
                      disabled={true}
                      onChange={(date: Date | null) =>
                        form.setValue("date_entered", date ?? undefined, {
                          shouldDirty: true,
                        })
                      }
                    />
                  </div>
                )}

                <ProductInputField
                  label="Date Sold"
                  name="date_sold"
                  register={form.register}
                  className="mt-[12px]"
                  inputType={"date"}
                  selected={dateSold}
                  disabled={false}
                  onChange={(date: Date | null) =>
                    form.setValue("date_sold", date ?? undefined, {
                      shouldDirty: true,
                    })
                  }
                  onCancel={() => {
                    form.setValue("date_sold", undefined, {
                      shouldDirty: true,
                    });
                  }}
                />
              </div>

              <ProductInputField
                label="Note"
                name="note"
                register={form.register}
                error={form.formState.errors.note?.message}
                disabled={false}
                className="w-[100%] mt-[10px] mb-[10px]"
                inputType={"textarea"}
                rows={2}
              />

              <div className="flex flex-row gap-[16px]">
                {(form.formState.isDirty || imagesChanged) && (
                  <button
                    type="submit"
                    className="cursor-pointer dim hover:brightness-75 mt-[20px] w-[200px] h-[40px] rounded-[8px] text-white font-semibold"
                    style={{
                      backgroundColor: appTheme[currentUser.theme].app_color_1,
                    }}
                  >
                    <div className="flex items-center justify-center">
                      Submit
                    </div>
                  </button>
                )}

                <div
                  onClick={handleBackButton}
                  className="cursor-pointer dim hover:brightness-75 mt-[20px] w-[200px] h-[40px] rounded-[8px] text-white font-semibold flex items-center justify-center"
                  style={{
                    backgroundColor:
                      currentUser.theme === "dark" ? "#999" : "#bbb",
                  }}
                >
                  Cancel
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export type { ProductFormData };
export default ProductView;
