// src/modules/UpdatesModule/UpdateCard.tsx
"use client";
import React, { useEffect } from "react";
import {
  useUpdatesForm,
  useUpdatesFormSubmit,
} from "@/hooks/forms/useUpdatesForm";
import { UpdateItemForm } from "@/util/schemas/updatesSchema";
import { Check, Clock, Trash, Edit, ArrowRight } from "lucide-react";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useUiStore } from "@/store/useUIStore";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import clsx from "clsx";
import { useCurrentDataStore } from "@/store/currentDataStore"; 
import { SubmitHandler } from "react-hook-form";
import { UpdateBase } from "@open-dream/shared";

/**
 * Props:
 * - update?: UpdateItemForm -> shows card populated (edit toggle triggers form)
 * - showAsNew?: boolean -> render a blank form for new request
 *
 * Behavior:
 * - show compact card by default
 * - clicking edit expands into a form (using react-hook-form)
 * - supports marking completed via toggle (calls toggleComplete)
 * - supports delete
 */

type Props = {
  update?: UpdateBase | null;
  showAsNew?: boolean;
};

const priorityColor = (p: string) => {
  if (p === "high") return "bg-red-100 text-red-600";
  if (p === "medium") return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-700";
};

const UpdateCard: React.FC<Props> = ({ update = null, showAsNew = false }) => {
  const currentTheme = useCurrentTheme();
  const { currentProjectId } = useCurrentDataStore();
  const { addRequest, upsertUpdate, deleteUpdate, toggleComplete } =
    useContextQueries();
  const { setAddingUpdate } = useUiStore();
  const form = useUpdatesForm(update ?? null);
  const { handleSubmit, register, watch, reset, formState } = form;
  const { onUpdatesFormSubmit } = useUpdatesFormSubmit();

  const isEditing =
    showAsNew || (update && watch("id") !== null && formState.isDirty);

  useEffect(() => {
    // if editing existing update, set default values
    if (update) {
      reset({
        ...update,
      });
    } else if (showAsNew) {
      reset({
        id: null,
        title: "",
        description: "",
        requested_by: "",
        assignee: "",
        status: "requested",
        priority: "medium",
        created_at: new Date().toISOString(),
        completed_at: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [update, showAsNew]);

  const shortDesc = (s?: string | null) =>
    !s ? "" : s.length > 120 ? s.slice(0, 117).trim() + "..." : s;

  const handleToggleCompleted = async (u: UpdateBase) => {
    if (!u.update_id) return;
    const newCompleted = u.status !== "completed";
    try {
      await toggleComplete(u.update_id, newCompleted);
    } catch (err) {
      console.error("Toggle complete failed", err);
    }
  };

  const onSubmit: SubmitHandler<UpdateItemForm> = async (data) => {
    const payload: UpdateItemForm = {
      ...data,
      project_idx: currentProjectId,
      completed_at:
        data.status === "completed" && !data.completed_at
          ? new Date().toISOString()
          : data.completed_at,
    };

    await upsertUpdate(payload);
    setAddingUpdate(false);
  };

  const onQuickRequest = async () => {
    const payload: Partial<UpdateItemForm> = {
      title: watch("title") || "New request",
      description: watch("description"),
      requested_by: watch("requested_by") || undefined,
      status: "requested",
      priority: watch("priority") || "medium",
    };
    try {
      await addRequest(payload);
      if (setAddingUpdate) setAddingUpdate(false);
    } catch (err) {
      console.error("Add request failed", err);
    }
  };

  return (
    <div
      className="rounded-xl p-4 shadow-sm"
      style={{
        background: currentTheme.background_2,
        boxShadow: "0 6px 18px rgba(10,10,10,0.04)",
      }}
    >
      {!isEditing && update && (
        <div className="flex items-start gap-3">
          <div
            className={clsx(
              "rounded-md p-2 shrink-0",
              priorityColor(update && update.priority ? update.priority : "low")
            )}
            style={{ minWidth: 48 }}
          >
            <div className="text-[12px] font-semibold text-center">
              {update.priority}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[15px] font-semibold truncate">
                  {update.title}
                </div>
                <div className="text-[13px] opacity-70 mt-1 truncate">
                  {shortDesc(update.description)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleCompleted(update)}
                  title={
                    update.status === "completed"
                      ? "Mark as not completed"
                      : "Mark as completed"
                  }
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-md"
                  style={{
                    background:
                      update.status === "completed"
                        ? "rgba(34,197,94,0.12)"
                        : currentTheme.background_2,
                    color: currentTheme.text_2,
                  }}
                >
                  <Check size={16} />
                </button>

                <button
                  onClick={() => {
                    reset(update);
                    // set addingUpdate true so the UI knows an edit form is open if needed
                    if (setAddingUpdate) setAddingUpdate(true);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-md"
                >
                  <Edit size={16} />
                </button>

                <button
                  onClick={() => update.update_id && deleteUpdate(update.update_id)}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-red-500 hover:brightness-90"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>

            <div className="mt-3 text-[12.5px] opacity-75">
              <div className="flex items-center gap-2">
                <div className="text-[12px] opacity-60">Requested by:</div>
                <div className="font-medium">{update.requested_by ?? "—"}</div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="text-[12px] opacity-60">Assignee:</div>
                <div className="font-medium">{update.assignee ?? "—"}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT / ADD FORM */}
      {(isEditing || showAsNew || !update) && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              {...register("title")}
              placeholder="Title"
              className="flex-1 rounded-md px-3 py-2 bg-transparent outline-none text-[14px]"
            />
            <select {...register("priority")} className="rounded-md px-3 py-2">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <textarea
            {...register("description")}
            placeholder="Describe the update or request..."
            rows={3}
            className="w-full rounded-md px-3 py-2 bg-transparent outline-none text-[14px] resize-none"
          />

          <div className="flex items-center gap-2">
            <input
              {...register("requested_by")}
              placeholder="Requested by"
              className="rounded-md px-3 py-2 flex-1"
            />
            <input
              {...register("assignee")}
              placeholder="Assignee (optional)"
              className="rounded-md px-3 py-2 w-[45%]"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <select {...register("status")} className="rounded-md px-3 py-2">
                <option value="requested">Requested</option>
                <option value="upcoming">Upcoming</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>

              <div className="text-[13px] opacity-70">
                Created:{" "}
                {new Date(
                  watch("created_at") || Date.now()
                ).toLocaleDateString()}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {showAsNew ? (
                <>
                  <button
                    type="button"
                    onClick={onQuickRequest}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium"
                    style={{ background: "#111827", color: "#fff" }}
                  >
                    <ArrowRight size={16} />
                    Request
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (setAddingUpdate) setAddingUpdate(false);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md border"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={!formState.isDirty && !update}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium"
                    style={{
                      background: currentTheme.app_color_1,
                      color: currentTheme.text_1,
                    }}
                  >
                    Save
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (update) {
                        reset(update);
                      } else {
                        reset();
                        if (setAddingUpdate) setAddingUpdate(false);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md border"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default UpdateCard;
