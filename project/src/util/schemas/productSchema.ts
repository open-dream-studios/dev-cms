// project/src/util/schemas/productSchema.ts
import { z } from "zod";

export const ProductSchema = z.object({
  serial_number: z
    .string()
    .min(14, "14 Characters Required")
    .transform((val) => val.toUpperCase())
    .refine((val) => /^[A-Z0-9]+$/.test(val), {
      message: "Only uppercase letters and numbers allowed",
    }),
  name: z.string().min(1, "Name is required"),
  customer_id: z.number().optional().nullable(),
  make: z.string().nullable(),
  model: z.string().nullable(),
  length: z
    .number()
    .min(0, "Must be a positive number")
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(String(val)), {
      message: "Max 2 decimal places",
    })
    .optional()
    .nullable(),
  width: z
    .number()
    .min(0, "Must be a positive number")
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(String(val)), {
      message: "Max 2 decimal places",
    })
    .optional()
    .nullable(),
  height: z
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

export const defaultProductValues: ProductFormData = {
  serial_number: "",
  name: "",
  customer_id: undefined,
  make: null,
  model: null,
  length: 0,
  width: 0,
  height: 0,
  description: null,
  note: null,
};
