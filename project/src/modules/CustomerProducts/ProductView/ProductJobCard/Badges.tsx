// project/src/modules/CustomerProducts/ProductView/ProductJobCard/ProductJobCard.tsx
import React from "react";
import { appTheme } from "@/util/appTheme";
import { AuthContext } from "@/contexts/authContext";
import type {
  JobDefinition,
  JobStatusOption,
  TaskStatusOption,
} from "@shared/types/models/jobs";
import "../../../components/Calendar/Calendar.css";
import { JobFormData, TaskFormData } from "@/util/schemas/jobSchema";
import { UseFormReturn, Path, useWatch } from "react-hook-form";
import { Check, Dot } from "lucide-react";
import { useUiStore } from "@/store/useUIStore";

// ---------- StatusBadge ----------
export const StatusBadge: React.FC<{
  form: UseFormReturn<JobFormData> | null;
  matchedDefinition: JobDefinition | null;
  cancelTimer: () => void;
  callSubmitForm: () => void;
  oneSize: boolean;
}> = ({ form, matchedDefinition, cancelTimer, callSubmitForm, oneSize }) => {
  if (!form || !matchedDefinition) return null;
  const status = useWatch({ control: form.control, name: "status" });
  const mapping: Record<string, { color: string; label: string }> = {
    waiting_diagnosis: { color: "#06b6d4", label: "Waiting On Diagnosis" },
    waiting_work: { color: "#60a5fa", label: "Work Required" },
    waiting_parts: { color: "#f59e0b", label: "Waiting On Parts" },
    waiting_customer: { color: "#f59e0b", label: "Waiting On Customer" },
    waiting_listing: { color: "#8b5cf6", label: "Ready To List" },
    listed: { color: "#8b5cf6", label: "Listed" },
    waiting_delivery: { color: "#60a5fa", label: "Ready For Delivery" },
    delivered: { color: "#16a34a", label: "Delivered" },
    complete: { color: "#16a34a", label: "Complete" },
    cancelled: { color: "#ef4444", label: "Cancelled" },
  };
  const info = mapping[status] ?? {
    color: "#94a3b8",
    label: status || "Unknown",
  };
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`${
        oneSize
          ? "pl-[12px] pr-[14px] gap-2"
          : "pl-[calc(0.3vw+7px)] pr-[calc(0.2vw+15px)] gap-[5%]"
      } cursor-pointer hover:brightness-75 dim inline-flex items-center rounded-full font-semibold`}
      style={{ background: `${info.color}20`, color: info.color }}
    >
      <span
        style={{
          borderRadius: 999,
          background: info.color,
          boxShadow: "0 0 8px rgba(0,0,0,0.18)",
        }}
        className={`brightness-[140%] ${
          oneSize
            ? "w-[8px] h-[8px]"
            : "min-w-[calc(5.5px+0.11vw)] aspect-[1/1]"
        }`}
      />
      <select
        {...form.register("status", {
          onChange: async () => {
            cancelTimer();
            await callSubmitForm();
          },
        })}
        className={`${
          oneSize ? "py-2 text-sm" : "py-[3%] text-[calc(10px+0.2vw)]"
        } brightness-[140%] pl-[17%] pr-[4%] rounded-full ml-[-20%] cursor-pointer outline-none border-none`}
      >
        {matchedDefinition.type.toLowerCase() === "service" && (
          <option value="waiting_diagnosis">
            {mapping["waiting_diagnosis"].label}
          </option>
        )}
        <option value="waiting_work">{mapping["waiting_work"].label}</option>
        <option value="waiting_parts">{mapping["waiting_parts"].label}</option>
        {matchedDefinition.type.toLowerCase() !== "resell" && (
          <option value="waiting_customer">
            {mapping["waiting_customer"].label}
          </option>
        )}
        {matchedDefinition.type.toLowerCase() === "resell" && (
          <option value="waiting_listing">
            {mapping["waiting_listing"].label}
          </option>
        )}
        {matchedDefinition.type.toLowerCase() === "resell" && (
          <option value="listed">{mapping["listed"].label}</option>
        )}
        {matchedDefinition.type.toLowerCase() !== "service" && (
          <option value="waiting_delivery">
            {mapping["waiting_delivery"].label}
          </option>
        )}
        {matchedDefinition.type.toLowerCase() !== "service" && (
          <option value="delivered">{mapping["delivered"].label}</option>
        )}
        {matchedDefinition.type.toLowerCase() === "service" && (
          <option value="complete">{mapping["complete"].label}</option>
        )}
        <option value="cancelled">{mapping["cancelled"].label}</option>
      </select>
    </div>
  );
};

// ---------- TaskStatusBadge ----------
export const TaskStatusBadge: React.FC<{
  form: UseFormReturn<TaskFormData> | null;
  matchedDefinition: JobDefinition | null;
  cancelTimer: () => void;
  callSubmitForm: () => void;
  oneSize: boolean;
}> = ({ form, matchedDefinition, cancelTimer, callSubmitForm, oneSize }) => {
  if (!form || !matchedDefinition) return null;
  const status = useWatch({ control: form.control, name: "status" });
  const mapping: Record<string, { color: string; label: string }> = {
    waiting_work: { color: "#60a5fa", label: "Work Required" },
    waiting_parts: { color: "#f59e0b", label: "Waiting On Parts" },
    waiting_customer: { color: "#f59e0b", label: "Waiting On Customer" },
    complete: { color: "#16a34a", label: "Complete" },
    cancelled: { color: "#ef4444", label: "Cancelled" },
  };
  const info = mapping[status] ?? {
    color: "#94a3b8",
    label: status || "Unknown",
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`${
        oneSize
          ? "pl-[12px] pr-[14px] gap-2"
          : "pl-[7%] pr-[7%] min-[800px]:pr-[calc(20px+0.3vw)] gap-[5%]"
      } cursor-pointer hover:brightness-75 dim inline-flex items-center rounded-full font-semibold`}
      style={{ background: `${info.color}20`, color: info.color }}
    >
      <span
        style={{
          borderRadius: 999,
          background: info.color,
          boxShadow: "0 0 8px rgba(0,0,0,0.18)",
        }}
        className={`brightness-[140%] ${
          oneSize
            ? "w-[8px] h-[8px]"
            : "hidden min-[800px]:flex min-w-[calc(5.5px+0.11vw)] aspect-[1/1]"
        }`}
      />
      <select
        {...form.register("status", {
          onChange: async () => {
            cancelTimer();
            await callSubmitForm();
          },
        })}
        className={`relative ${
          oneSize
            ? "py-2 text-sm"
            : "max-[800px]:w-[calc(23px+3vw)] min-[800px]:flex py-[3%] text-[calc(10px+0.2vw)]"
        } brightness-[140%] rounded-full cursor-pointer outline-none border-none max-[800px]:text-transparent`}
      >
        <option value="waiting_work">{mapping["waiting_work"].label}</option>
        <option value="waiting_parts">{mapping["waiting_parts"].label}</option>
        {matchedDefinition.type.toLowerCase() === "service" && (
          <option value="waiting_customer">
            {mapping["waiting_customer"].label}
          </option>
        )}
        <option value="complete">{mapping["complete"].label}</option>
        <option value="cancelled">{mapping["cancelled"].label}</option>
      </select>

      <div className="w-[100%] ml-[-6%] mt-[1%] justify-center max-[800px]:flex hidden absolute top-1/2 -translate-y-1/2 pointer-events-none">
        {status === "complete" ? <Check size={18} /> : <Dot size={33} />}
      </div>
    </div>
  );
};

// ---------- PriorityBadge ----------
export type PriorityBadgeForm = {
  priority: "low" | "medium" | "high" | "urgent";
  status: JobStatusOption | TaskStatusOption;
};

export const PriorityBadge = <T extends PriorityBadgeForm>({
  form,
  cancelTimer,
  callSubmitForm,
  oneSize,
}: {
  form: UseFormReturn<T> | null;
  cancelTimer: () => void;
  callSubmitForm: () => void;
  oneSize: boolean;
}) => {
  const { screen } = useUiStore();
  const { currentUser } = React.useContext(AuthContext);
  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];

  if (!form) return null;

  const priority = useWatch({
    control: form.control,
    name: "priority" as Path<T>,
  });
  const status = useWatch({ control: form.control, name: "status" as Path<T> });

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`${
        oneSize ? "hover:brightness-90 pr-[14px] gap-2" : "pl-[calc(0.3vw+7px)] pr-[calc(0.2vw+15px)] gap-[5%] hover:brightness-[83%]"
      } cursor-pointer dim inline-flex items-center rounded-full font-semibold`}
      style={{
        background:
          status === "complete" ||
          status === "cancelled" ||
          status === "delivered"
            ? t.background_2
            : priority === "urgent"
            ? "rgba(239,68,68,0.12)"
            : priority === "high"
            ? "#f59e0b20"
            : t.background_2,
      }}
    >
      <select
        {...form.register("priority" as Path<T>, {
          onChange: async () => {
            cancelTimer();
            await callSubmitForm();
          },
        })}
        style={{
          color:
            status === "complete" ||
            status === "cancelled" ||
            status === "delivered"
              ? t.text_1
              : priority === "urgent"
              ? "#ef4444"
              : priority === "high"
              ? "#f59e0b"
              : t.text_1,
          filter:
            priority === "urgent" || priority === "high"
              ? "brightness(140%)"
              : "none",
        }}
        className={`w-[100%] ${
          oneSize ? "pl-[14px] min-w-[95px] py-2 text-sm" : "py-[6%] text-[calc(10px+0.2vw)]"
        } brightness-[140%] pr-[5px] rounded-full cursor-pointer outline-none border-none`}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
    </div>
  );
};
