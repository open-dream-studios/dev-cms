// src/hooks/forms/useUpdatesForm.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UpdateItemSchema,
  UpdateItemForm,
  updateToForm,
} from "@/util/schemas/updatesSchema";
import { UpdateInput } from "@open-dream/shared";

export function useUpdatesForm(update?: UpdateInput | null) {
  return useForm<UpdateItemForm>({
    resolver: zodResolver(UpdateItemSchema),
    defaultValues: updateToForm(update),
    mode: "onChange",
    shouldUnregister: false,
  });
}