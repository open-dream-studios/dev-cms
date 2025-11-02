// project/src/util/schemas/productSchema.ts
import { z } from "zod";
import { Product } from "@open-dream/shared";

export const ProductSchema = z.object({
  serial_number: z
    .string()
    .min(10, "10 Characters Required")
    .transform((val) => val.toUpperCase())
    .refine((val) => /^[A-Z0-9]+$/.test(val), {
      message: "Only uppercase letters and numbers allowed",
    }),
  name: z.string().optional().nullable(),
  customer_id: z.number().optional().nullable(),
  make: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  // length: z
  //   .number()
  //   .min(0, "Must be a positive number")
  //   .refine((val) => /^\d+(\.\d{1,2})?$/.test(String(val)), {
  //     message: "Max 2 decimal places",
  //   })
  //   .optional()
  //   .nullable(),
  // width: z
  //   .number()
  //   .min(0, "Must be a positive number")
  //   .refine((val) => /^\d+(\.\d{1,2})?$/.test(String(val)), {
  //     message: "Max 2 decimal places",
  //   })
  //   .optional()
  //   .nullable(),
  // height: z
  //   .number()
  //   .min(0, "Must be a positive number")
  //   .refine((val) => /^\d+(\.\d{1,2})?$/.test(String(val)), {
  //     message: "Max 2 decimal places",
  //   })
  //   .optional()
  //   .nullable(),
  length: z.coerce
    .number()
    .min(0, "Must be a positive number")
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(String(val)), {
      message: "Max 2 decimal places",
    })
    .optional()
    .nullable(),

  width: z.coerce
    .number()
    .min(0, "Must be a positive number")
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(String(val)), {
      message: "Max 2 decimal places",
    })
    .optional()
    .nullable(),

  height: z.coerce
    .number()
    .min(0, "Must be a positive number")
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(String(val)), {
      message: "Max 2 decimal places",
    })
    .optional()
    .nullable(),
  description: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export type ProductFormData = z.infer<typeof ProductSchema>;

export function productToForm(product?: Product | null): ProductFormData {
  return {
    serial_number: product?.serial_number ?? "",
    name: product?.name ?? "",
    customer_id: product?.customer_id ?? null,
    make: product?.make ?? null,
    model: product?.model ?? null,
    length: product?.length ?? null,
    width: product?.width ?? null,
    height: product?.height ?? null,
    description: product?.description ?? null,
    note: product?.note ?? null,
  };
}
