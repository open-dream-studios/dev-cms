// src/util/schemas/customerSchema.ts
import { z } from "zod";
import { Customer } from "@/types/customers";

export const CustomerSchema = z.object({
  first_name: z.string().min(1, "First name required"),
  last_name: z.string().min(1, "Last name required"),
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .or(z.literal("")) // allow empty string
    .optional(),
  phone: z
    .string()
    .or(z.literal("")) // allow empty string
    .refine((val) => (val ? val.replace(/\D/g, "").length === 10 : true), {
      message: "Phone number must be exactly 10 digits",
    })
    .transform((val) => (val ? val.replace(/\D/g, "") : ""))
    .optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerFormData = z.infer<typeof CustomerSchema>;

/**
 * Normalize DB Customer -> Form values
 */
export function customerToForm(customer?: Customer | null): CustomerFormData {
  if (!customer) {
    return {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      zip: "",
      notes: "",
    };
  }

  return {
    first_name: customer.first_name ?? "",
    last_name: customer.last_name ?? "",
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    address_line1: customer.address_line1 ?? "",
    address_line2: customer.address_line2 ?? "",
    city: customer.city ?? "",
    state: customer.state ?? "",
    zip: customer.zip ?? "",
    notes: customer.notes ?? "",
  };
}
