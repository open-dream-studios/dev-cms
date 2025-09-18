// project/src/hooks/useProductForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductSchema, ProductFormData, defaultProductValues } from "@/util/schemas/productSchema";

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
