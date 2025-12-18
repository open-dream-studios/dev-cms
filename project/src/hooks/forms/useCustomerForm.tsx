// src/hooks/forms/useCustomerForm.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CustomerSchema,
  CustomerFormData,
  customerToForm,
} from "@/util/schemas/customerSchema";
import { CustomerInput } from "@open-dream/shared";

export function useCustomerForm(customer?: CustomerInput | null) {
  return useForm<CustomerFormData>({
    resolver: zodResolver(CustomerSchema),
    defaultValues: customerToForm(customer),
    mode: "onChange",
  });
}