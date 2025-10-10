// project/src/util/schemas/customerSchema.ts
import { z } from "zod";
import { Customer } from "@/types/customers";

export const CustomerSchema = z.object({
  first_name: z.string().min(1, "First name required"),
  last_name: z.string().min(1, "Last name required"),
  email: z
    .string()
    .or(z.literal("")) // allow empty string
    .optional()
    .nullable(),
  phone: z
    .string()
    .or(z.literal(""))
    .refine((val) => (val ? val.replace(/\D/g, "").length === 10 : true), {
      message: "Phone number must be 10 digits",
    })
    .transform((val) => (val ? val.replace(/\D/g, "") : ""))
    .optional()
    .nullable(),
  address_line1: z.string().optional().nullable(),
  address_line2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CustomerFormData = z.infer<typeof CustomerSchema>;

export function customerToForm(customer?: Customer | null): CustomerFormData {
  return {
    first_name: customer?.first_name ?? "",
    last_name: customer?.last_name ?? "",
    email: customer?.email ?? null,
    phone: customer?.phone ?? null,
    address_line1: customer?.address_line1 ?? null,
    address_line2: customer?.address_line2 ?? null,
    city: customer?.city ?? null,
    state: customer?.state ?? null,
    zip: customer?.zip ?? null,
    notes: customer?.notes ?? null,
  };
}