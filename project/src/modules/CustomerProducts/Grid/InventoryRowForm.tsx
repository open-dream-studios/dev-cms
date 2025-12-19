// project/src/modules/CustomerProducts/Grid/InventoryRowForm.tsx
"use client";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useProductForm } from "@/hooks/forms/useProductForm";
import ProductInputCell from "../Forms/InputCell";
import { useContext, useEffect, useMemo } from "react";
import { AuthContext } from "@/contexts/authContext";
import { productToForm } from "@/util/schemas/productSchema";
import { InventoryDataItem } from "./InventoryGrid";
import Image from "next/image";
import { FaPlus } from "react-icons/fa6";
import { Product, MediaLink, Media } from "@open-dream/shared";
import { useRouting } from "@/hooks/useRouting";
import { useFormInstanceStore } from "@/store/util/formInstanceStore";
import { DelayType } from "@/hooks/util/useAutoSave";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import RenderedImage from "@/modules/components/ProductCard/RenderedImage";

type InventoryRowFormProps = {
  resetTimer: (delay: DelayType) => void;
  product: Product;
  inventoryDataLayout: InventoryDataItem[];
};
const InventoryRowForm = ({
  resetTimer,
  product,
  inventoryDataLayout,
}: InventoryRowFormProps) => {
  const { currentUser } = useContext(AuthContext);
  const { screenClick } = useRouting();
  const { productsData, mediaLinks, media } = useContextQueries();
  const currentTheme = useCurrentTheme();

  const formKey = `product-${product.serial_number}`;
  const { registerForm, unregisterForm } = useFormInstanceStore();
  const productForm = useProductForm();
  const { register } = productForm;

  useEffect(() => {
    registerForm(formKey, productForm);
    return () => unregisterForm(formKey);
  }, [formKey, productForm, registerForm, unregisterForm]);

  useEffect(() => {
    const subscription = productForm.watch(() => {
      const dirty = Object.keys(productForm.formState.dirtyFields).length > 0;
      if (dirty) {
        resetTimer("slow");
      }
    });
    return () => subscription.unsubscribe();
  }, [productForm, resetTimer]);

  useEffect(() => {
    if (product.serial_number) {
      const matchingProduct = productsData.find(
        (item) => item.serial_number === product.serial_number
      );
      productForm.reset(productToForm(matchingProduct));
    }
  }, [product.serial_number, productForm, productsData]);

  const handleProductClick = async () => {
    const existingProduct = productsData?.find(
      (p) => p.serial_number === product.serial_number
    );
    if (existingProduct) {
      await screenClick(
        "edit-customer-product",
        `/products/${existingProduct.serial_number}`
      );
    }
  };

  const itemMedia = useMemo(() => {
    const mediaLinksFound = mediaLinks.filter(
      (m: MediaLink) =>
        m.entity_type === "product" && m.entity_id === product.id
    );
    if (mediaLinksFound.length) {
      return media.find((m: Media) => m.id === mediaLinksFound[0].media_id);
    } else {
      return null;
    }
  }, [product, mediaLinks, media]);

  if (!currentUser) return null;

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="select-none w-full flex flex-row h-[60px] items-center"
    >
      <div
        style={{
          borderRight: `0.5px solid ${currentTheme.background_3}`,
        }}
        className={`pl-[10.5px] h-[100%] flex items-center ${inventoryDataLayout[0].className}`}
      >
        <div
          onClick={handleProductClick}
          className="cursor-pointer dim hover:brightness-75"
        >
          <div className="relative w-[42px] h-[42px]">
            {itemMedia ? (
              <div className="rounded-[4px] overflow-hidden">
                <RenderedImage media={itemMedia} rounded={true} />
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: currentTheme.header_1_1,
                }}
                className="w-[100%] h-[100%] rounded-[5px] flex items-center justify-center pb-[2px] pr-[2px]"
              >
                <FaPlus color={currentTheme.text_1} size={20} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        onClick={handleProductClick}
        className={`cursor-pointer dim hover:brightness-75 flex items-center h-[100%] w-[100%] pl-[7px] pr-[6px] py-[4px] text-[12px] ${inventoryDataLayout[1].className}`}
        style={{
          borderRight: `0.5px solid ${currentTheme.background_3}`,
        }}
      >
        <div className="w-[100%] overflow-hidden">{product.serial_number}</div>
      </div>

      <ProductInputCell
        name="name"
        register={register}
        error={productForm.formState.errors.name?.message}
        inputType="input"
        onInput={(e) => {
          productForm.setValue("name", e.currentTarget.value, {
            shouldDirty: true,
          });
        }}
        className={`h-[100%] ${inventoryDataLayout[2].className}`}
      />

      {/* <ProductInputCell
        name="price"
        inputMode="decimal"
        pattern="^\d+(\.\d{0,2})?$"
        inputType={"input"}
        onInput={(e) => {
          let value = e.currentTarget.value;
          value = value.replace(/[^0-9.]/g, "");
          const parts = value.split(".");
          if (parts.length > 2) value = parts[0] + "." + parts[1];
          if (parts[1]?.length > 2) {
            parts[1] = parts[1].slice(0, 2);
            value = parts[0] + "." + parts[1];
          }
          e.currentTarget.value = value;
          // form.setValue("price", parseFloat(value), {
          //   shouldDirty: true,
          // });
        }}
        register={form.register}
        registerOptions={{
          required: "Price is required",
          validate: (value) =>
            /^\d+(\.\d{1,2})?$/.test(String(value)) || "Max 2 decimal places",
          setValueAs: (v) => (v === "" ? undefined : parseFloat(v)),
        }}
        error={form.formState.errors.price?.message}
        className={`h-[100%] ${inventoryDataLayout[3].className}`}
      /> */}

      <ProductInputCell
        name="make"
        register={register}
        error={productForm.formState.errors.make?.message}
        className={`h-[100%] ${inventoryDataLayout[3].className}`}
        inputType={"input"}
        onInput={(e) => {
          productForm.setValue("make", e.currentTarget.value, {
            shouldDirty: true,
          });
        }}
      />

      <ProductInputCell
        name="model"
        register={register}
        error={productForm.formState.errors.model?.message}
        className={`h-[100%] ${inventoryDataLayout[4].className}`}
        inputType={"input"}
        onInput={(e) => {
          productForm.setValue("model", e.currentTarget.value, {
            shouldDirty: true,
          });
        }}
      />

      <ProductInputCell
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
          // form.setValue("length", parseFloat(value), {
          //   shouldDirty: true,
          //   shouldValidate: true,
          // });
        }}
        register={register}
        registerOptions={{
          required: "Length is required",
          validate: (value) =>
            /^\d+(\.\d{1,2})?$/.test(String(value)) || "Max 2 decimal places",
          setValueAs: (v) => (v === "" ? undefined : parseFloat(v)),
        }}
        error={productForm.formState.errors.length?.message}
        className={`h-[100%] ${inventoryDataLayout[5].className}`}
      />

      <ProductInputCell
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
          // form.setValue("width", parseFloat(value), {
          //   shouldDirty: true,
          //   shouldValidate: true,
          // });
        }}
        register={register}
        registerOptions={{
          required: "Width is required",
          validate: (value) =>
            /^\d+(\.\d{1,2})?$/.test(String(value)) || "Max 2 decimal places",
          setValueAs: (v) => (v === "" ? undefined : parseFloat(v)),
        }}
        error={productForm.formState.errors.width?.message}
        className={`h-[100%] ${inventoryDataLayout[6].className}`}
      />

      <ProductInputCell
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
          // form.setValue("width", parseFloat(value), {
          //   shouldDirty: true,
          //   shouldValidate: true,
          // });
        }}
        register={register}
        registerOptions={{
          required: "Width is required",
          validate: (value) =>
            /^\d+(\.\d{1,2})?$/.test(String(value)) || "Max 2 decimal places",
          setValueAs: (v) => (v === "" ? undefined : parseFloat(v)),
        }}
        error={productForm.formState.errors.width?.message}
        className={`h-[100%] ${inventoryDataLayout[7].className}`}
      />

      {/* <ProductInputCell
        name="repair_status"
        register={form.register}
        className={`h-[100%] ${inventoryDataLayout[9].className}`}
        inputType={"dropdown"}
        options={[]}
        onInput={(e) => {
          // form.setValue(
          //   "product_status",
          //   e.currentTarget.value as "In Progress" | "Complete",
          //   {
          //     shouldDirty: true,
          //   }
          // );
        }}
      /> */}

      {/* <ProductInputCell
        name="sale_status"
        register={form.register}
        className={`h-[100%] ${inventoryDataLayout[10].className}`}
        inputType={"dropdown"}
        options={[]}
        onInput={(e) => {
          // form.setValue(
          //   "product_status",
          //   e.currentTarget.value as "In Progress" | "Complete",
          //   {
          //     shouldDirty: true,
          //   }
          // );
        }}
      /> */}

      {/* <ProductInputCell
        name="date_entered"
        register={register}
        className={`h-[100%] ${inventoryDataLayout[11].className}`}
        inputType={"date"}
        // selected={dateComplete ?? undefined}
        selected={undefined}
        // onChange={(date: Date | null) =>
        //   form.setValue("date_complete", date ?? undefined, {
        //     shouldDirty: true,
        //   })
        // }
        // onCancel={() => {
        //   form.setValue("date_complete", undefined, {
        //     shouldDirty: true,
        //   });
        // }}
      /> */}

      {/* <ProductInputCell
        name="date_complete"
        register={register}
        className={`h-[100%] ${inventoryDataLayout[12].className}`}
        inputType={"date"}
        // selected={dateComplete ?? undefined}
        selected={undefined}
        // onChange={(date: Date | null) =>
        //   form.setValue("date_complete", date ?? undefined, {
        //     shouldDirty: true,
        //   })
        // }
        // onCancel={() => {
        //   form.setValue("date_complete", undefined, {
        //     shouldDirty: true,
        //   });
        // }}
      /> */}

      <ProductInputCell
        name="description"
        register={register}
        error={productForm.formState.errors.description?.message}
        inputType={"textarea"}
        rows={1}
        className={`h-[100%] ${inventoryDataLayout[8].className}`}
        onType={(newValue: string) => {
          productForm.setValue("description", newValue, {
            shouldDirty: true,
          });
        }}
      />

      <ProductInputCell
        name="note"
        register={register}
        error={productForm.formState.errors.note?.message}
        inputType={"textarea"}
        rows={1}
        className={`h-[100%] ${inventoryDataLayout[9].className}`}
        onType={(newValue: string) => {
          productForm.setValue("note", newValue, {
            shouldDirty: true,
          });
        }}
      />
    </form>
  );
};

export default InventoryRowForm;
