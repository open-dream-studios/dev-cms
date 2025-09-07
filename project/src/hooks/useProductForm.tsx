// project/src/hooks/useProductForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductSchema, ProductFormData } from "@/util/schemas/productSchema";

export const useProductForm = (initialData?: Partial<ProductFormData>) => {
  return useForm<ProductFormData>({
    resolver: zodResolver(ProductSchema),
    mode: "onChange",
    defaultValues: {
      serial_number: "",
      name: "",
      customer_id: undefined,
      description: "",
      make: "",
      model: "",
      price: 0,
      date_sold: undefined,
      date_entered: undefined,
      repair_status: "In Progress",
      sale_status: "Not Yet Posted",
      length: 0,
      width: 0,
      note: "",
      ...initialData,
    },
  });
};
