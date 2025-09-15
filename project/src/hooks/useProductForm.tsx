// project/src/hooks/useProductForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductSchema, ProductFormData } from "@/util/schemas/productSchema";

export const defaultProductValues: ProductFormData = {
  serial_number: "",
  name: "",
  customer_id: undefined,
  description: "",
  make: "",
  model: "",
  price: 0,
  job_type: "service",
  product_status: "waiting_work",
  date_complete: null,
  length: 0,
  width: 0,
  height: 0,
  note: "",
};

export const useProductForm = (initialData?: Partial<ProductFormData>) => {
  return useForm<ProductFormData>({
    resolver: zodResolver(ProductSchema),
    mode: "onChange",
    defaultValues: {
      ...defaultProductValues,
      ...initialData,
    },
  });
};
