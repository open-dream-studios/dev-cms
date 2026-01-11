// project/src/util/schemas/leadSchema.ts
import { Lead, LeadStatus, LeadType } from "@open-dream/shared";
import * as z from "zod";

export const LeadSchema = z.object({
  customer_id: z.string().optional().nullable(),
  lead_type: z.string().optional().nullable(),
  product_id: z.string().optional().nullable(),
  job_definition_id: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type LeadFormData = z.infer<typeof LeadSchema>;

export const defaultLeadValues: LeadFormData = {
  customer_id: null,
  lead_type: "product" as LeadType,
  product_id: null,
  job_definition_id: null,
  status: "new" as LeadStatus,
  notes: null,
};

export function leadToForm(lead?: Lead | null): LeadFormData {
  return {
    customer_id: lead?.customer_id ?? null,
    lead_type: lead?.lead_type ?? "product" as LeadType,
    product_id: lead?.product_id ?? null,
    job_definition_id: lead?.job_definition_id ?? null,
    status: lead?.status ?? "new" as LeadStatus,
    notes: lead?.notes ?? null,
  };
}
