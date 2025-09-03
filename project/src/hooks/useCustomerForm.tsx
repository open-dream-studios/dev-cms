// src/hooks/useCustomerForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CustomerSchema,
  CustomerFormData,
  customerToForm,
} from "@/util/schemas/customerSchema";
import { Customer } from "@/types/customers";

export function useCustomerForm(customer?: Customer | null) {
  return useForm<CustomerFormData>({
    resolver: zodResolver(CustomerSchema),
    defaultValues: customerToForm(customer),
  });
}