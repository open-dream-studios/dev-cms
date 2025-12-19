// project/src/hooks/forms/useProductForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProductSchema,
  ProductFormData,
  productToForm,
} from "@/util/schemas/productSchema";
import { Product } from "@open-dream/shared";

export function useProductForm(product?: Product | null) {
  return useForm<ProductFormData>({
    resolver: zodResolver(ProductSchema) as any,
    defaultValues: productToForm(product),
    mode: "onChange",
  });
}
