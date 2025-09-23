// project/src/screens/Inventory/InventoryRowForm.tsx
"use client";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useProductForm } from "@/hooks/useProductForm";
import { appTheme } from "@/util/appTheme";
import ProductInputCell from "../Forms/InputCell";
import { useContext, useEffect, useMemo } from "react";
import { AuthContext } from "@/contexts/authContext";
import { ProductFormData } from "@/util/schemas/productSchema";
import { InventoryDataItem } from "./InventoryGrid";
import Image from "next/image";
import { UseFormReturn } from "react-hook-form";
import { FaPlus } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/contexts/appContext";
import { Product } from "@/types/products";
import { MediaLink } from "@/types/media";

type InventoryRowFormProps = {
  product: Product;
  inventoryDataLayout: InventoryDataItem[];
  registerFormRef: (
    serial: string,
    form: UseFormReturn<ProductFormData>
  ) => void;
};
const InventoryRowForm = ({
  product,
  inventoryDataLayout,
  registerFormRef,
}: InventoryRowFormProps) => {
  const { currentUser } = useContext(AuthContext);
  const { formRefs, screenClick, resetTimer, setLocalData } = useAppContext();
  const { productsData, mediaLinks } = useContextQueries();
  const form = useProductForm();
  const router = useRouter();
  // registerFormRef(product.serial_number, form);

  let newProduct = false;

  // const dateComplete = form.watch("date_complete");

  useEffect(() => {
    if (!newProduct && product.serial_number) {
      const matchingProduct = productsData.find(
        (item) => item.serial_number === product.serial_number
      );
      if (!matchingProduct) return;
      if (!matchingProduct || !matchingProduct.serial_number) return;
      const formDefaults: Partial<ProductFormData> = {
        ...matchingProduct,
        serial_number: matchingProduct.serial_number ?? "",
        customer_id: matchingProduct.customer_id ?? undefined,
        name: matchingProduct.name ?? "",
        make: matchingProduct.make ?? null,
        model: matchingProduct.model ?? null,
        description: matchingProduct.description ?? null,
        note: matchingProduct.note ?? null,
        length: matchingProduct.length ? Number(matchingProduct.length) : 0,
        width: matchingProduct.width ? Number(matchingProduct.width) : 0,
        height: matchingProduct.height ? Number(matchingProduct.height) : 0,
      };
      form.reset(formDefaults);
    }
  }, [newProduct, product.serial_number, form.reset, productsData]);

  const handleProductClick = async () => {
    let dirtyRows = 0;
    for (const [serial, form] of formRefs.current.entries()) {
      if (Object.keys(form.formState.dirtyFields).length !== 0) {
        dirtyRows += 1;
      }
    }

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

  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // console.log(product, name, value[name as keyof typeof value]);
      resetTimer(false);

      setLocalData((prev) => {
        const updated = [...prev];
        const index = updated.findIndex(
          (p) => p.serial_number === product.serial_number
        );
        if (index !== -1) {
          updated[index] = {
            ...updated[index],
            ...value,
          } as Product;
        }
        return updated;
      });
    });

    return () => subscription.unsubscribe();
  }, [form, product.serial_number]);

  const itemImage = useMemo(() => {
    const mediaLinksFound = mediaLinks.filter(
      (m: MediaLink) =>
        m.entity_type === "product" && m.entity_id === product.id
    );
    return mediaLinksFound.length > 0 ? mediaLinksFound[0] : null;
  }, [product, mediaLinks]);

  if (!currentUser) return null;

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="select-none w-full flex flex-row h-[60px] items-center"
    >
      <div
        style={{
          borderRight: `0.5px solid ${
            appTheme[currentUser.theme].background_3
          }`,
        }}
        className={`pl-[10.5px] h-[100%] flex items-center ${inventoryDataLayout[0].className}`}
      >
        <div
          onClick={handleProductClick}
          className="cursor-pointer dim hover:brightness-75"
        >
          <div className="relative w-[42px] h-[42px]">
            {itemImage ? (
              <>
                {/\.(mp4|mov)$/i.test(itemImage.url) ? (
                  <video
                    src={itemImage.url}
                    className="object-cover w-[42px] h-[42px] rounded-[5px]"
                    playsInline
                    muted
                    loop
                  />
                ) : (
                  <Image
                    src={itemImage.url}
                    alt="image"
                    width={42}
                    height={42}
                    className="object-cover w-[42px] h-[42px] rounded-[5px]"
                  />
                )}
              </>
            ) : (
              <div
                style={{
                  backgroundColor: appTheme[currentUser.theme].header_1_1,
                }}
                className="w-[100%] h-[100%] rounded-[5px] flex items-center justify-center pb-[2px] pr-[2px]"
              >
                <FaPlus color={appTheme[currentUser.theme].text_1} size={20} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        onClick={handleProductClick}
        className={`cursor-pointer dim hover:brightness-75 flex items-center h-[100%] w-[100%] pl-[7px] pr-[6px] py-[4px] text-[12px] ${inventoryDataLayout[1].className}`}
        style={{
          borderRight: `0.5px solid ${
            appTheme[currentUser.theme].background_3
          }`,
        }}
      >
        <div className="w-[100%] overflow-hidden">{product.serial_number}</div>
      </div>

      <ProductInputCell
        name="name"
        register={form.register}
        error={form.formState.errors.name?.message}
        inputType="input"
        onInput={(e) => {
          form.setValue("name", e.currentTarget.value, { shouldDirty: true });
        }}
        className={`h-[100%] ${inventoryDataLayout[2].className}`}
      />

      <ProductInputCell
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
      />

      <ProductInputCell
        name="make"
        register={form.register}
        error={form.formState.errors.make?.message}
        className={`h-[100%] ${inventoryDataLayout[4].className}`}
        inputType={"input"}
        onInput={(e) => {
          form.setValue("make", e.currentTarget.value, { shouldDirty: true });
        }}
      />

      <ProductInputCell
        name="model"
        register={form.register}
        error={form.formState.errors.model?.message}
        className={`h-[100%] ${inventoryDataLayout[5].className}`}
        inputType={"input"}
        onInput={(e) => {
          form.setValue("model", e.currentTarget.value, { shouldDirty: true });
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
        register={form.register}
        registerOptions={{
          required: "Length is required",
          validate: (value) =>
            /^\d+(\.\d{1,2})?$/.test(String(value)) || "Max 2 decimal places",
          setValueAs: (v) => (v === "" ? undefined : parseFloat(v)),
        }}
        error={form.formState.errors.length?.message}
        className={`h-[100%] ${inventoryDataLayout[6].className}`}
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
        register={form.register}
        registerOptions={{
          required: "Width is required",
          validate: (value) =>
            /^\d+(\.\d{1,2})?$/.test(String(value)) || "Max 2 decimal places",
          setValueAs: (v) => (v === "" ? undefined : parseFloat(v)),
        }}
        error={form.formState.errors.width?.message}
        className={`h-[100%] ${inventoryDataLayout[7].className}`}
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
        register={form.register}
        registerOptions={{
          required: "Width is required",
          validate: (value) =>
            /^\d+(\.\d{1,2})?$/.test(String(value)) || "Max 2 decimal places",
          setValueAs: (v) => (v === "" ? undefined : parseFloat(v)),
        }}
        error={form.formState.errors.width?.message}
        className={`h-[100%] ${inventoryDataLayout[8].className}`}
      />

      <ProductInputCell
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
      />

      <ProductInputCell
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
      />

      <ProductInputCell
        name="date_entered"
        register={form.register}
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
      />

      <ProductInputCell
        name="date_complete"
        register={form.register}
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
      />

      <ProductInputCell
        name="description"
        register={form.register}
        error={form.formState.errors.description?.message}
        inputType={"textarea"}
        rows={1}
        className={`h-[100%] ${inventoryDataLayout[13].className}`}
        onType={(newValue: string) => {
          form.setValue("description", newValue, {
            shouldDirty: true,
          });
        }}
      />

      <ProductInputCell
        name="note"
        register={form.register}
        error={form.formState.errors.note?.message}
        inputType={"textarea"}
        rows={1}
        className={`h-[100%] ${inventoryDataLayout[14].className}`}
        onType={(newValue: string) => {
          form.setValue("note", newValue, {
            shouldDirty: true,
          });
        }}
      />
    </form>
  );
};

export default InventoryRowForm;
