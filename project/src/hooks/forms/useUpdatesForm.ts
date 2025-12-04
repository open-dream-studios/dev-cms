// src/hooks/forms/useUpdatesForm.ts
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateItemSchema, UpdateItemForm } from "@/util/schemas/updatesSchema";
import { SubmitHandler } from "react-hook-form";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useUiStore } from "@/store/useUIStore";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { UpdateInput } from "@open-dream/shared";

export function useUpdatesForm(update?: Partial<UpdateItemForm> | null) {
  return useForm<UpdateItemForm>({
    resolver: zodResolver(UpdateItemSchema),
    defaultValues: {
      id: update?.id ?? null,
      project_idx: update?.project_idx ?? null,
      title: update?.title ?? "",
      description: update?.description ?? null,
      requested_by: update?.requested_by ?? null,
      assignee: update?.assignee ?? null,
      status: update?.status ?? "requested",
      priority: update?.priority ?? "medium",
      created_at: update?.created_at ?? new Date().toISOString(),
      completed_at: update?.completed_at ?? null,
    } as UpdateInput,
    mode: "onChange",
    shouldUnregister: false,
  });
}

export function useUpdatesFormSubmit() {
  const { upsertUpdate } = useContextQueries();
  const { setAddingUpdate } = useUiStore?.() ?? ({} as any);
  const { currentProjectId } = useCurrentDataStore?.() ?? ({} as any);

  const onUpdatesFormSubmit: SubmitHandler<UpdateItemForm> = async (data) => {
    if (!currentProjectId) return;
    const payload: UpdateItemForm = {
      ...data,
      project_idx: currentProjectId,
      // if status is completed and no completed_at set, set it now
      completed_at:
        data.status === "completed" && !data.completed_at
          ? new Date().toISOString()
          : data.completed_at,
    };

    try {
      await upsertUpdate(payload);
      // be defensive: if ui store available, close add modal
      if (setAddingUpdate) setAddingUpdate(false);
    } catch (err) {
      console.error("❌ Update upsert failed in form:", err);
    }
  };

  return { onUpdatesFormSubmit };
}
