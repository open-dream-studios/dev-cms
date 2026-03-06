// src/modules/UpdatesModule/UpdateCard.tsx
"use client";
import React, { useContext, useEffect } from "react";
import { useUpdatesForm } from "@/hooks/forms/useUpdatesForm";
import { UpdateItemForm } from "@/util/schemas/updatesSchema";
import { Check, Trash, Edit, ArrowRight } from "lucide-react";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import { useUiStore } from "@/store/useUIStore";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { SubmitHandler } from "react-hook-form";
import { UpdateBase } from "@open-dream/shared";
import { AuthContext } from "@/contexts/authContext";

type Props = {
  update?: UpdateBase | null;
  showAsNew?: boolean;
};

const priorityPillStyle = (p: string, isDark: boolean) => {
  if (p === "high") {
    return {
      backgroundColor: isDark ? "rgba(239,68,68,0.20)" : "#FCE8E8",
      color: isDark ? "#FCA5A5" : "#B42318",
    };
  }
  if (p === "medium") {
    return {
      backgroundColor: isDark ? "rgba(245,158,11,0.20)" : "#FFF4DB",
      color: isDark ? "#FCD34D" : "#9A6700",
    };
  }
  return {
    backgroundColor: isDark ? "rgba(148,163,184,0.18)" : "#EEF2F7",
    color: isDark ? "#CBD5E1" : "#475467",
  };
};

const statusLabel = (status?: string | null) => {
  if (status === "in_progress") return "In Progress";
  if (status === "upcoming") return "Upcoming";
  if (status === "completed") return "Completed";
  return "Requested";
};

const UpdateCard: React.FC<Props> = ({ update = null, showAsNew = false }) => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { currentProjectId } = useCurrentDataStore();
  const { addRequest, upsertUpdate, deleteUpdate, toggleComplete } =
    useContextQueries();
  const { setAddingUpdate } = useUiStore();
  const form = useUpdatesForm(update ?? null);
  const { handleSubmit, register, watch, reset, formState } = form;

  const isEditing =
    showAsNew || (update && watch("id") !== null && formState.isDirty);
  const isDark = currentUser?.theme === "dark";
  const ui = {
    cardBg: isDark ? "#1C1C1C" : "#FFFFFF",
    cardBorder: isDark
      ? "1px solid rgba(255,255,255,0.04)"
      : "1px solid #E3E7EE",
    cardShadow: isDark
      ? "0 6px 18px rgba(0,0,0,0.24)"
      : "0 10px 24px rgba(21,31,56,0.10)",
    mutedSurface: isDark ? "#272727" : "#F1F4F9",
    controlSurface: isDark ? "#252525" : "#f2f4f7c1",
    controlBorder: isDark
      ? "1px solid rgba(255,255,255,0.06)"
      : "1px solid #D8E0EC",
    subtleText: isDark ? "#A7A7A7" : "#64748B",
    headingText: isDark ? "#F2F2F2" : "#1E293B",
    dangerBg: isDark ? "rgba(207,45,39,0.16)" : "rgba(207,45,39,0.14)",
  };

  useEffect(() => {
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

  if (!currentUser) return null;

  return (
    <div
      className="rounded-[15px] p-[10px] transition-all duration-200 shadow-xl"
      style={{
        background: ui.cardBg,
        border: ui.cardBorder,
        // boxShadow: ui.cardShadow,
      }}
    >
      {!isEditing && update && (
        <div className="flex flex-col gap-[9px]">
          <div className="flex items-start justify-between gap-[10px]">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-[8px]">
                <div
                  className="h-[8px] w-[8px] rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      update.status === "completed"
                        ? "#22c55e"
                        : update.priority === "high"
                          ? "#ef4444"
                          : update.priority === "medium"
                            ? "#f59e0b"
                            : "#94a3b8",
                  }}
                />
                <div className="text-[14px] font-[600] truncate">
                  {update.title || "Untitled"}
                </div>
              </div>

              <div
                className="text-[12.5px] mt-[3px] truncate pl-[16px]"
                style={{ color: ui.subtleText }}
              >
                {shortDesc(update.description) || "No description"}
              </div>
            </div>

            <div className="flex items-center gap-[5px]">
              <div
                className="px-[10px] h-[23px] rounded-full text-[11.5px] font-[600] flex items-center"
                style={{
                  backgroundColor: ui.mutedSurface,
                  color: ui.subtleText,
                }}
              >
                {statusLabel(update.status)}
              </div>
              <div
                className="px-[10px] h-[23px] rounded-full text-[11.5px] font-[600] flex items-center capitalize"
                style={priorityPillStyle(
                  update && update.priority ? update.priority : "low",
                  isDark,
                )}
              >
                {update.priority || "low"}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-[8px]">
            <div className="flex items-center gap-[6px] min-w-0">
              <div
                className="rounded-full px-[10px] h-[22px] text-[11.5px] flex items-center truncate"
                style={{
                  backgroundColor: ui.mutedSurface,
                  color: ui.subtleText,
                }}
              >
                <span className="opacity-[0.6] mr-[4px]">Req:</span>
                {update.requested_by || "-"}
              </div>
              <div
                className="rounded-full px-[10px] h-[22px] text-[11.5px] flex items-center truncate"
                style={{
                  backgroundColor: ui.mutedSurface,
                  color: ui.subtleText,
                }}
              >
                <span className="opacity-[0.6] mr-[4px]">Asg:</span>
                {update.assignee || "-"}
              </div>
            </div>

            <div
              className="text-[11px] whitespace-nowrap"
              style={{ color: ui.subtleText }}
            >
              {new Date(update.created_at || Date.now()).toLocaleDateString()}
            </div>
          </div>

          {currentUser.admin && (
            <div
              className="flex items-center justify-end gap-[6px] pt-[2px]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => handleToggleCompleted(update)}
                title={
                  update.status === "completed"
                    ? "Mark as not completed"
                    : "Mark as completed"
                }
                className="h-[28px] w-[28px] rounded-full flex items-center justify-center hover:brightness-90 dim"
                style={{
                  backgroundColor:
                    update.status === "completed"
                      ? "rgba(34,197,94,0.15)"
                      : ui.mutedSurface,
                  color:
                    update.status === "completed" ? "#22c55e" : ui.subtleText,
                }}
              >
                <Check size={14} />
              </button>

              <button
                onClick={() => {
                  reset(update);
                  if (setAddingUpdate) setAddingUpdate(true);
                }}
                className="h-[28px] w-[28px] rounded-full flex items-center justify-center hover:brightness-90 dim"
                style={{
                  backgroundColor: ui.mutedSurface,
                  color: ui.subtleText,
                }}
              >
                <Edit size={14} />
              </button>

              <button
                onClick={() =>
                  update.update_id && deleteUpdate(update.update_id)
                }
                className="h-[28px] w-[28px] rounded-full flex items-center justify-center hover:brightness-90 dim"
                style={{
                  backgroundColor: ui.dangerBg,
                  color: currentTheme.delete,
                }}
              >
                <Trash size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {(isEditing || showAsNew || !update) && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-[8px]">
          <div className="flex items-center gap-[7px]">
            <input
              {...register("title")}
              placeholder="Title"
              className="flex-1 rounded-[10px] px-3 h-[34px] outline-none text-[13.5px] placeholder:opacity-85"
              style={{
                backgroundColor: ui.controlSurface,
                border: ui.controlBorder,
                color: ui.headingText,
              }}
            />
            <div
              style={{
                backgroundColor: ui.controlSurface,
                border: ui.controlBorder,
                color: ui.headingText,
              }}
              className="rounded-[10px] px-3 h-[34px] cursor-pointer hover:brightness-90 dim"
            >
              <select
                {...register("priority")}
                className="h-[100%] text-[13px] outline-none border-none cursor-pointer"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <textarea
            {...register("description")}
            placeholder="Describe the update or request..."
            rows={3}
            className="w-full rounded-[10px] px-3 py-2 outline-none text-[13.5px] resize-none placeholder:opacity-85"
            style={{
              backgroundColor: ui.controlSurface,
              border: ui.controlBorder,
              color: ui.headingText,
            }}
          />

          <div className="flex items-center gap-[7px]">
            <input
              {...register("requested_by")}
              placeholder="Requested by"
              className="rounded-[10px] px-3 h-[34px] flex-1 text-[13px] outline-none placeholder:opacity-85"
              style={{
                backgroundColor: ui.controlSurface,
                border: ui.controlBorder,
                color: ui.headingText,
              }}
            />
            <input
              {...register("assignee")}
              placeholder="Assignee (optional)"
              className="rounded-[10px] px-3 h-[34px] w-[45%] text-[13px] outline-none placeholder:opacity-85"
              style={{
                backgroundColor: ui.controlSurface,
                border: ui.controlBorder,
                color: ui.headingText,
              }}
            />
          </div>

          <div className="flex items-center justify-between gap-[8px]">
            <div className="flex items-center gap-[12px] min-w-0">
              <div
                style={{
                  backgroundColor: ui.controlSurface,
                  border: ui.controlBorder,
                  color: ui.headingText,
                }}
                className="rounded-[10px] px-3 h-[34px] cursor-pointer hover:brightness-90 dim"
              >
                <select
                  {...register("status")}
                  className="h-[100%] text-[12.5px] outline-none border-none"
                >
                  <option value="requested">Requested</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div
                className="text-[11.5px] whitespace-nowrap"
                style={{ color: ui.subtleText }}
              >
                Created{" "}
                {new Date(
                  watch("created_at") || Date.now(),
                ).toLocaleDateString()}
              </div>
            </div>

            <div className="flex items-center gap-[6px]">
              {showAsNew ? (
                <>
                  <button
                    type="button"
                    onClick={onQuickRequest}
                    className="inline-flex items-center gap-[6px] pl-[12px] pr-[14px] h-[31px] rounded-full text-[12px] font-[600] cursor-pointer hover:brightness-90 dim"
                    style={{
                      background: currentTheme.app_color_1,
                      color: "#fff",
                    }}
                  >
                    <ArrowRight size={14} />
                    Request
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (setAddingUpdate) setAddingUpdate(false);
                    }}
                    className="inline-flex items-center gap-[6px] pl-[12px] pr-[12px] h-[31px] rounded-full text-[12px] font-[500] cursor-pointer hover:brightness-90 dim"
                    style={{
                      backgroundColor: ui.mutedSurface,
                      border: ui.controlBorder,
                      color: ui.headingText,
                    }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={!formState.isDirty && !update}
                    className="inline-flex items-center gap-[6px] pl-[12px] pr-[14px] h-[31px] rounded-full text-[12px] font-[600] hover:brightness-90 dim disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: currentTheme.app_color_1,
                      color: "#fff",
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
                    className="inline-flex items-center gap-[6px] pl-[12px] pr-[12px] h-[31px] rounded-full text-[12px] font-[500] hover:brightness-90 dim"
                    style={{
                      backgroundColor: ui.mutedSurface,
                      border: ui.controlBorder,
                      color: ui.headingText,
                    }}
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
