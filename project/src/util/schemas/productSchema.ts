// project/src/util/schemas/productSchema.ts
import { z } from "zod";

export const ProductSchema = z.object({
  name: z.string(),
  customer_id: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
  serial_number: z
    .string()
    .min(14, "14 Characters Required")
    .transform((val) => val.toUpperCase())
    .refine((val) => /^[A-Z0-9]+$/.test(val), {
      message: "Only uppercase letters and numbers allowed",
    }),
  make: z.string().nullable(),
  model: z.string().nullable(),
  price: z
    .number()
    .min(0, "Must be a positive number")
    .refine((val) => /^\d+(\.\d{1,2})?$/.test(String(val)), {
      message: "Max 2 decimal places",
    })
    .optional()
    .nullable(),
  job_type: z.enum(["service", "refurbishment", "resell"]),
  product_status: z.enum([
    "waiting_diagnosis",
    "waiting_work",
    "waiting_listing",
    "listed",
    "waiting_delivery",
    "delivered",
    "complete",
  ]),
  date_complete: z.date().optional().nullable(),
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
  note: z.string().optional().nullable(),
});

export type ProductFormData = z.infer<typeof ProductSchema>;
