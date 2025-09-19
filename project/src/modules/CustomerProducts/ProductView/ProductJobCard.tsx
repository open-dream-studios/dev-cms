// project/src/modules/Jobs/JobCard.tsx
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Activity,
  Calendar,
  Clock,
  Tag,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import { appTheme } from "@/util/appTheme";
import { AuthContext } from "@/contexts/authContext";
import { getCardStyle, getInnerCardStyle } from "@/styles/themeStyles";
import type {
  Job,
  JobDefinition,
  Task,
  PriorityOption,
  JobStatusOption,
  TaskStatusOption,
} from "@/types/jobs";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { FaPlus, FaWrench } from "react-icons/fa6";
import { FaUserLarge } from "react-icons/fa6";
import ScheduleTimeline from "@/modules/components/Calendar/Calendar";
import DatePicker from "react-datepicker";
import "../../components/Calendar/Calendar.css";
import { BsThreeDots, BsThreeDotsVertical } from "react-icons/bs";
import { FiEdit } from "react-icons/fi";
import { useJobForm } from "@/hooks/useJobForm";
import { JobFormData } from "@/util/schemas/jobSchema";
import { UseFormReturn } from "react-hook-form";
import { Product } from "@/types/products";
import { dateToString, formatDateTime } from "@/util/functions/Time";

// ---------- CircularProgress ----------
const CircularProgress: React.FC<{
  value: number; // 0-100
  size?: number;
  stroke?: number;
  color?: string;
  bg?: string;
}> = ({
  value,
  size = 56,
  stroke = 7,
  color = "#06b6d4",
  bg = "rgba(255,255,255,0.06)",
}) => {
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (value / 100) * circumference;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="block"
    >
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={bg}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
      />
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={11.2}
        style={{ fontWeight: 700, fill: "white", opacity: 0.5 }}
      >
        {Math.round(value)}%
      </text>
    </svg>
  );
};

// ---------- StatusBadge ----------
const StatusBadge: React.FC<{
  form: UseFormReturn<JobFormData> | null;
}> = ({ form }) => {
  if (!form) return null;
  const status = form.watch("status");
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
  if (!form) return null;
  return (
    <div
      className="cursor-pointer hover:brightness-75 dim inline-flex items-center gap-2 pl-[12px] pr-[14px] rounded-full text-[13px] font-semibold"
      style={{ background: `${info.color}20`, color: info.color }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: info.color,
          boxShadow: "0 0 8px rgba(0,0,0,0.18)",
        }}
        className="brightness-[140%]"
      />
      <select
        {...form.register("status")}
        className="brightness-[140%] pl-[24px] pr-[5px] rounded-full ml-[-26px] cursor-pointer py-2 text-sm outline-none border-none"
      >
        <option value="waiting_diagnosis">
          {mapping["waiting_diagnosis"].label}
        </option>
        <option value="waiting_work">{mapping["waiting_work"].label}</option>
        <option value="waiting_parts">{mapping["waiting_parts"].label}</option>
        <option value="waiting_customer">
          {mapping["waiting_customer"].label}
        </option>
        <option value="waiting_listing">
          {mapping["waiting_listing"].label}
        </option>
        <option value="listed">{mapping["listed"].label}</option>
        <option value="waiting_delivery">
          {mapping["waiting_delivery"].label}
        </option>
        <option value="delivered">{mapping["delivered"].label}</option>
        <option value="complete">{mapping["complete"].label}</option>
        <option value="cancelled">{mapping["cancelled"].label}</option>
      </select>
    </div>
  );
};

// ---------- TaskStatusBadge ----------
const TaskStatusBadge: React.FC<{
  status: TaskStatusOption;
  setStatus: React.Dispatch<React.SetStateAction<TaskStatusOption>>;
}> = ({ status, setStatus }) => {
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
      className="cursor-pointer hover:brightness-75 dim inline-flex items-center gap-2 pl-[12px] pr-[10px] rounded-full text-[13px] font-semibold"
      style={{ background: `${info.color}20`, color: info.color }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: info.color,
          boxShadow: "0 0 8px rgba(0,0,0,0.18)",
        }}
        className="brightness-[140%]"
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as TaskStatusOption)}
        className="brightness-[140%] pl-[22px] pr-[5px] rounded-full ml-[-26px] cursor-pointer h-[25px] text-[13px] outline-none border-none"
      >
        <option value="waiting_work">{mapping["waiting_work"].label}</option>
        <option value="waiting_parts">{mapping["waiting_parts"].label}</option>
        <option value="waiting_customer">
          {mapping["waiting_customer"].label}
        </option>
        <option value="complete">{mapping["complete"].label}</option>
        <option value="cancelled">{mapping["cancelled"].label}</option>
      </select>
    </div>
  );
};

// ---------- PriorityBadge ----------
const PriorityBadge: React.FC<{
  form: UseFormReturn<JobFormData> | null;
}> = ({ form }) => {
  const { currentUser } = React.useContext(AuthContext);
  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];

  if (!form) return null;
  const priority = form.watch("priority");

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="rounded-full pr-[10px] cursor-pointer hover:brightness-[93%] dim"
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
        {...form.register("priority")}
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
        className="cursor-pointer font-[500] outline-none border-none rounded-full pl-[10px] w-[90px] h-[25px] text-[13px] opacity-[0.95]"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
    </div>
  );
};

// ---------- TaskCard ----------
const TaskCard: React.FC<{
  task: Task;
  idx: number;
  resetSignal: number;
  registerSafeRef: (ref: HTMLElement | null) => void;
}> = ({ task, idx, resetSignal, registerSafeRef }) => {
  const { currentUser } = React.useContext(AuthContext);
  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];

  const threeDotsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    registerSafeRef(threeDotsRef.current); // register with parent
  }, [registerSafeRef]);

  // reset when signal changes
  useEffect(() => {
    setDeleteButtonVisible(false);
  }, [resetSignal]);

  // fake part data example (you'd replace with real part listing)
  const fakeParts =
    idx % 2 === 0
      ? [
          { id: "p1", name: "Valve kit", qty: 1, status: "on_order" },
          { id: "p2", name: "Rubber seal", qty: 2, status: "in_stock" },
        ]
      : [{ id: "p3", name: "Filter", qty: 1, status: "missing" }];

  const completed = task.status === "complete";

  const [taskDate, setTaskDate] = useState<Date | null>(new Date());
  const people = ["Paul", "Dan"];
  const [priority, setPriority] = useState<PriorityOption>("medium");
  const [status, setStatus] = useState<TaskStatusOption>("waiting_work");
  const [deleteButtonVisible, setDeleteButtonVisible] =
    useState<boolean>(false);
  const [descriptionOpen, setDescriptionOpen] = useState<boolean>(false);
  const [editAssignment, setEditAssignment] = useState<boolean>(false);

  return (
    <div
      className="rounded-xl relative"
      style={{
        ...getInnerCardStyle(theme, t),
        transform: "translateZ(0)",
      }}
    >
      <div
        className={`${
          deleteButtonVisible
            ? "pointer-events-auto z-[501]"
            : "opacity-0 pointer-events-none z-[100]"
        } transition-opacity duration-300 ease-in-out w-[100%] h-[100%] absolute left-0 top-0 rounded-xl`}
      >
        <div className="w-[100%] h-[100%] bg-black opacity-[0.1] z-[500] absolute left-0 top-0 rounded-xl" />
        <div
          style={{
            border: "1px solid " + t.background_3,
            backgroundColor: t.background_2,
          }}
          className={`${
            deleteButtonVisible
              ? "pointer-events-auto z-[501]"
              : "opacity-0 pointer-events-none"
          } transition-all duration-300 ease-in-out absolute right-[10px] top-[25px] shadow-xl z-[502] w-[100px] h-[35px] rounded-[6px] flex items-center justify-center cursor-pointer hover:brightness-90 dim`}
        >
          <div
            onClick={() => {
              // if (task.task_id) {
              // deleteTask(task.task_id)
              // }
              console.log("delete task");
            }}
            className="text-[13px] font-[500] opacity-[0.8]"
          >
            Delete Task
          </div>
        </div>
      </div>

      <div className="w-[100%] h-[100%] z-[300] flex items-start gap-[13px] p-3">
        <div
          onClick={() => {
            setDeleteButtonVisible((prev) => !prev);
          }}
          ref={threeDotsRef}
          className="absolute flex items-end flex-col z-[500] top-[6px] right-[14px] cursor-pointer hover:brightness-90 dim"
        >
          <BsThreeDots size={20} className="opacity-[0.2]" />
        </div>
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{
            background: completed
              ? "rgba(115,255,115,0.29)"
              : "rgba(6,182,212,0.18)",
          }}
        >
          {completed ? <Check size={18} /> : <Activity size={18} />}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-[12px]">
            <div className="flex flex-col gap-[8px] w-[100%]">
              <input
                type="text"
                className="mt-[3px] w-[100%] text-[15px] font-[500] outline-none truncate"
                placeholder="Task..."
              />

              <div
                className={`relative rounded-[5px] transition-all duration-200 ${
                  descriptionOpen ? "h-[120px]" : "h-[30px]"
                }`}
                style={{ backgroundColor: appTheme[theme].background_2 }}
              >
                <textarea
                  // value={notes ?? ""}
                  // onChange={(e) => setNotes(e.target.value)}
                  className="hide-scrollbar w-[calc(100%-30px)] h-[100%] text-[14px] leading-[16px] opacity-[0.7] outline-none border-none resize-none px-3 py-[6.7px]"
                  placeholder="Description..."
                />

                <div
                  onClick={() => setDescriptionOpen((prev) => !prev)}
                  className="flex justify-center items-center cursor-pointer hover:brightness-90 dim w-[36px] h-[30px] right-[3px] top-[0px] absolute z-[300]"
                >
                  {descriptionOpen ? (
                    <ChevronUp size={22} className="opacity-30" />
                  ) : (
                    <ChevronDown size={22} className="opacity-30" />
                  )}
                </div>
              </div>

              <div className="flex flex-start gap-[8px] mt-[1px] flex-row w-[100%]">
                <Calendar
                  size={15}
                  className="opacity-[0.4] min-w-[15px] mt-[6px]"
                />
                <div className="min-w-[100px] relative">
                  <DatePicker
                    selected={taskDate}
                    onChange={(date) => setTaskDate(date)}
                    className={`w-full outline-none rounded-md px-2 py-1 text-[13px] ${
                      theme === "dark"
                        ? "text-[#999] border-[#3d3d3d] border-[1px]"
                        : "text-black border-[#111] border-[0.5px]"
                    }`}
                    calendarClassName={
                      theme === "dark" ? "datepicker-dark" : "datepicker-light"
                    }
                    popperClassName={
                      theme === "dark" ? "datepicker-dark" : "datepicker-light"
                    }
                  />
                </div>

                <div className="ml-[9px] mt-[4px] mr-[3px] opacity-[0.6] text-[12px] font-[500]">
                  Assignment
                </div>

                <div className="w-[100%] flex-wrap gap-[8px] flex flex-row mt-[1px]">
                  {people.map((person: any, index: number) => {
                    return (
                      <div className="relative" key={index}>
                        <div
                          style={{
                            backgroundColor: "#60a5fa20",
                          }}
                          className="relative h-[25px] px-[15px] rounded-full flex items-center cursor-pointer hover:brightness-[80%] dim "
                        >
                          <div
                            style={{
                              color: "#60a5fa",
                            }}
                            className="select-none brightness-130 text-[12px] font-[500] mt-[-0.8px]"
                          >
                            {person}
                          </div>
                        </div>
                        {editAssignment && (
                          <div
                            style={{
                              backgroundColor: t.background_4,
                            }}
                            className="cursor-pointer hover:brightness-[45%] dim brightness-[55%] w-[13px] h-[13px] z-[300] absolute right-[-5px] top-[-5px] rounded-full bg-red-400 flex items-center justify-center"
                          >
                            <div
                              className="w-[6px] h-[1.5px] rounded-full"
                              style={{
                                backgroundColor: t.text_1,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div
                    className="ml-[1px] cursor-pointer hover:brightness-90 dim w-[25px] h-[25px] rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: t.background_2,
                    }}
                  >
                    <FaPlus size={12} className="opacity-[0.6]" />
                  </div>

                  <div
                    className="cursor-pointer mt-[-0.5px] hover:brightness-90 dim w-[26px] h-[26px] rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: t.background_2,
                      border: editAssignment ? "1px solid " + t.text_3 : "none",
                    }}
                    onClick={() => setEditAssignment((prev) => !prev)}
                  >
                    <FiEdit size={12} className="opacity-[0.6]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center flex-row gap-[10px]">
              <div className="flex flex-col gap-[4px]">
                <div className="select-none ml-[3px] opacity-[0.2] text-[13px] font-[500]">
                  Priority
                </div>
                <PriorityBadge form={null} />
              </div>

              <div className="flex flex-col gap-[4px]">
                <div className="select-none ml-[4px] opacity-[0.2] text-[13px] font-[500]">
                  Status
                </div>
                <TaskStatusBadge status={status} setStatus={setStatus} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- MiniTaskCard ----------
const MiniTaskCard: React.FC<{
  task: Task;
  idx: number;
  setTasksCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ task, idx, setTasksCollapsed }) => {
  const { currentUser } = React.useContext(AuthContext);
  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];

  const completed = task.status === "complete";
  const [priority, setPriority] = useState<PriorityOption>("medium");
  const [status, setStatus] = useState<TaskStatusOption>("waiting_work");

  return (
    <div
      className="cursor-pointer hover:brightness-[86%] dim rounded-xl relative"
      style={getInnerCardStyle(theme, t)}
    >
      <div
        onClick={() => {
          setTasksCollapsed(false);
        }}
        className="w-[100%] h-[100%] z-[300] flex items-start gap-[13px] p-3"
      >
        <div
          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center"
          style={{
            background: completed
              ? "rgba(115,255,115,0.45)"
              : "rgba(6,182,212,0.2)",
          }}
        >
          {completed ? <Check size={16.5} /> : <Activity size={15.2} />}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-[12px]">
            <div className="flex flex-col gap-[8px] w-[100%]">
              <div className="mt-[3px] w-[100%] text-[15px] font-[500] outline-none truncate">
                {task.task}
              </div>
            </div>

            <div className="flex items-center flex-row gap-[10px] mt-[2px]">
              <div className="flex flex-col gap-[4px]">
                <PriorityBadge form={null} />
              </div>

              <div className="flex flex-col gap-[4px]">
                <TaskStatusBadge status={status} setStatus={setStatus} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- JobCard (main) ----------
type ProductJobProps = {
  productJob: Job | null;
  matchedDefinition: JobDefinition | null;
  matchedProduct: Product | null;
};

const ProductJobCard: React.FC<ProductJobProps> = ({
  productJob,
  matchedDefinition,
  matchedProduct,
}) => {
  const { currentUser } = useContext(AuthContext);
  const { tasks: allTasks, deleteJob, upsertJob } = useContextQueries();
  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];

  if (!matchedDefinition || !productJob) return null;

  useEffect(() => {
    jobForm.reset(productJob as JobFormData);
  }, [productJob]);

  const jobForm = useJobForm();

  const onFormSubmitButton = async (data: JobFormData) => {
    const submitValue = {
      ...data,
      scheduled_start_date: dateToString(data.scheduled_start_date ?? null),
      completed_date: dateToString(data.completed_date ?? null),
      valuation: data.valuation ?? 0,
      job_id: productJob.job_id ? productJob.job_id : null,
      job_definition_id: matchedDefinition.id,
      product_id:
        matchedProduct && matchedProduct.id ? matchedProduct.id : null,
      customer_id:
        matchedProduct && matchedProduct.customer_id
          ? matchedProduct.customer_id
          : null,
    } as Job;
    await upsertJob(submitValue);
  };

  // fake tasks if not provided
  const defaultTasks: Task[] = [
    {
      task_id: "T-001",
      job_id: 1,
      status: "waiting_work",
      priority: "high",
      scheduled_start_date: new Date(),
      completed_date: null,
      task: "Inspect outer shell and remove corrosion",
      description: "spa pack",
    },
    {
      task_id: "T-002",
      job_id: 1,
      status: "waiting_parts",
      priority: "medium",
      scheduled_start_date: new Date(Date.now() + 1000 * 60 * 60 * 24),
      completed_date: null,
      task: "Replace valve kit",
      description: "spa pack",
    },
    {
      task_id: "T-003",
      job_id: 1,
      status: "complete",
      priority: "low",
      scheduled_start_date: new Date(Date.now() - 1000 * 60 * 60 * 24),
      completed_date: new Date(),
      task: "Clean & polish",
      description: "spa pack",
    },
  ];

  const tasks = useMemo(() => {
    return defaultTasks;
    // if (!jobProp) return [];
    // return allTasks.filter((task: Task) => task.job_id === jobProp.id);
  }, [allTasks]);

  const completedCount = tasks.filter((t) => t.status === "complete").length;
  const progressPct = Math.round(
    (completedCount / Math.max(1, tasks.length)) * 100
  );

  const [noteOpen, setNoteOpen] = useState(false);
  const [tasksCollapsed, setTasksCollapsed] = useState(true);
  const [editAssignment, setEditAssignment] = useState<boolean>(false);
  const [deleteButtonVisible, setDeleteButtonVisible] =
    useState<boolean>(false);
  const [resetSignal, setResetSignal] = useState<number>(0);
  const parentRef = useRef<HTMLFormElement | null>(null);
  const childRefs = useRef<HTMLElement[]>([]);
  const threeDotsRef = useRef<HTMLDivElement | null>(null);

  const registerChildRef = (ref: HTMLElement | null) => {
    if (ref && !childRefs.current.includes(ref)) {
      childRefs.current.push(ref);
    }
  };
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (parentRef.current && !parentRef.current.contains(target)) return;
      if (childRefs.current.some((ref) => ref.contains(target))) return;
      if (threeDotsRef.current?.contains(target)) return;
      setDeleteButtonVisible(false);
      setResetSignal((prev) => prev + 1);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  function addTask() {
    if (!productJob) return;
    const newTask: Task = {
      task_id: `T-${Math.floor(Math.random() * 9000 + 1000)}`,
      job_id: productJob.id ?? 1,
      status: "waiting_work",
      priority: "medium",
      scheduled_start_date: null,
      completed_date: null,
      task: "New task",
      description: "spa pack",
    };
    // setTasks((p) => [newTask, ...p]);
  }

  const people = ["Paul", "Dan"];

  if (!currentUser) return null;

  return (
    <form
      className="w-[100%] rounded-2xl px-[16px] pt-[14px] pb-[16px"
      style={getCardStyle(theme, t)}
      ref={parentRef}
      onSubmit={jobForm.handleSubmit(onFormSubmitButton)}
    >
      {/* TOP ROW */}
      <div className="flex items-start justify-between w-full">
        <div className="flex items-center gap-[15px]">
          <div
            className="p-3 rounded-xl shadow-sm"
            style={{
              backgroundColor: t.background_3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 56,
              minHeight: 56,
            }}
          >
            <FaWrench
              size={20}
              className="opacity-[0.65]"
              style={{ color: t.text_1 }}
            />
          </div>

          <div className="flex flex-col mt-[6px]">
            <div className="mt-[-4px] flex flex-row gap-[5px] items-center">
              <div
                style={{ color: t.text_1 }}
                className="text-[20px] leading-[24px] font-semibold mt-[-5px]"
              >
                {matchedDefinition.type} {" Job"}
              </div>
              <div className="relative flex flex-row gap-[3px] items-center mt-[-5px]">
                <div
                  ref={threeDotsRef}
                  className="opacity-[0.5] cursor-pointer hover:brightness-75 dim"
                >
                  <BsThreeDotsVertical
                    size={18}
                    onClick={() => {
                      setDeleteButtonVisible(true);
                    }}
                  />
                </div>
                {deleteButtonVisible ? (
                  <div
                    style={{
                      border: "1px solid " + t.background_3,
                      backgroundColor: t.background_2,
                    }}
                    className="shadow-xl z-[502] w-[100px] h-[35px] rounded-[6px] flex items-center justify-center cursor-pointer hover:brightness-90 dim"
                  >
                    <div
                      onClick={async () => {
                        if (productJob.job_id) {
                          deleteJob(productJob.job_id);
                        }
                      }}
                      className="text-[13px] font-[500] opacity-[0.8]"
                    >
                      Delete Job
                    </div>
                  </div>
                ) : (
                  <button
                    type="submit"
                    style={{
                      border: "1px solid " + t.background_3,
                      backgroundColor: t.background_2,
                    }}
                    className="shadow-xl z-[502] w-[100px] h-[35px] rounded-[6px] flex items-center justify-center cursor-pointer hover:brightness-90 dim"
                  >
                    <div className="text-[13px] font-[500] opacity-[0.8]">
                      Save Job
                    </div>
                  </button>
                )}
              </div>
            </div>

            <div className="mt-[2px] flex items-center gap-2">
              <div className="opacity-[0.4] mt-[-3px] text-[15px] font-medium">
                Priority
              </div>
              <PriorityBadge form={jobForm} />
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-[15px] py-[6.5px] px-[12px] rounded-[10px]"
          style={getInnerCardStyle(theme, t)}
        >
          <div className="flex flex-col gap-[7px]">
            <p className="ml-[2.5px] mt-[-3px] font-[500] text-[13px] leading-[15px] opacity-[0.26]">
              Job Status
            </p>
            <StatusBadge form={jobForm} />
          </div>
          <CircularProgress
            value={progressPct}
            size={55}
            stroke={8}
            color={progressPct >= 100 ? "#22c55e" : "#06b6d4"}
            bg={
              theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"
            }
          />
        </div>
      </div>

      {matchedDefinition.type === "Resell" && (
        <div className="flex items-center mb-[10px] mt-[1px]">
          <p className="opacity-[0.4] mr-[10px] text-[15px] font-[500]">
            Resell Price
          </p>
          <div
            style={{
              backgroundColor: t.background_2,
            }}
            className="rounded-[6px] px-[9px] flex flex-row gap-[2px] w-[140px] items-center"
          >
            <p className="opacity-[0.65] font-[500] text-[15px]">$</p>
            <input
              {...jobForm.register("valuation", {
                required: "Price is required",
                validate: (value) =>
                  /^\d+(\.\d{1,2})?$/.test(String(value)) ||
                  "Max 2 decimal places",
                setValueAs: (v) => (v === "" ? undefined : parseFloat(v)),
              })}
              type={"text"}
              inputMode="decimal"
              pattern="^\d+(\.\d{0,2})?$"
              onInput={(e) => {
                let value = e.currentTarget.value;
                value = value.replace(/[^0-9.]/g, "");
                const parts = value.split(".");
                if (parts.length > 2) value = parts[0] + "." + parts[1];
                if (parts[1]?.length > 2) {
                  parts[1] = parts[1].slice(0, 2);
                  value = parts[0] + "." + parts[1];
                }
                e.currentTarget.value = value;
              }}
              className="w-[100%] border-none outline-none text-[15px] font-[500] opacity-[0.7] input rounded-[7px] pr-[10px] py-[4px] truncate"
            />
          </div>
        </div>
      )}

      {/* MIDDLE */}
      <div className="w-[100%] h-auto mt-[13.5px] gap-[14px] flex flex-col">
        <div className="flex flex-col gap-[12px]">
          <div
            className="rounded-xl px-[15px] pt-[11px] pb-[10px] w-[100%]"
            style={getInnerCardStyle(theme, t)}
          >
            <div className="flex items-start justify-between">
              <div>
                <div
                  className="text-[15px] font-[600] ml-[3px]"
                  style={{ color: t.text_2 }}
                >
                  Job Details
                </div>
              </div>

              {productJob.updated_at && (
                <div className="flex items-center mt-[2.5px] mr-[5px] text-xs gap-[6px] flex-row opacity-[0.6]">
                  <Clock size={14} className="ml-[4px]" />
                  <div className="ml-[1px]">Updated</div>
                  <div
                    className="font-semibold opacity-[0.85]"
                    style={{ color: t.text_1 }}
                  >
                    {formatDateTime(productJob.updated_at)}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-[10.5px]">
              <div
                className={`relative rounded-[8px] transition-all duration-200 ${
                  noteOpen ? "h-[210px]" : "h-[56px]"
                }`}
                style={{ backgroundColor: appTheme[theme].background_2 }}
              >
                <textarea
                  {...jobForm.register("notes")}
                  className="hide-scrollbar w-[calc(100%-30px)] h-[100%] text-[14px] opacity-[0.95] outline-none border-none resize-none bg-transparent px-3 py-2 rounded-[7px]"
                  placeholder="Details..."
                />

                <div
                  onClick={() => setNoteOpen((p) => !p)}
                  className="flex justify-center items-center cursor-pointer hover:brightness-90 dim w-[36px] h-[30px] right-[3px] top-[0px] absolute z-[300]"
                >
                  {noteOpen ? (
                    <ChevronUp size={22} className="opacity-30" />
                  ) : (
                    <ChevronDown size={22} className="opacity-30" />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-[14px] flex flex-row gap-[13px] items-start">
              <div
                className="text-[14px] font-[500] ml-[3px] mt-[1.5px] opacity-[0.6]"
                style={{ color: t.text_2 }}
              >
                Assignment
              </div>

              <div className="w-[100%] flex-wrap gap-[8px] flex flex-row mt-[1px]">
                {people.map((person: any, index: number) => {
                  return (
                    <div className="relative" key={index}>
                      <div
                        style={{
                          backgroundColor: "#60a5fa20",
                        }}
                        className="relative h-[25px] px-[15px] rounded-full flex items-center cursor-pointer hover:brightness-[80%] dim "
                      >
                        <div
                          style={{
                            color: "#60a5fa",
                          }}
                          className="select-none brightness-130 text-[12px] font-[500] mt-[-0.8px]"
                        >
                          {person}
                        </div>
                      </div>
                      {editAssignment && (
                        <div
                          style={{
                            backgroundColor: t.background_4,
                          }}
                          className="cursor-pointer hover:brightness-[45%] dim brightness-[55%] w-[13px] h-[13px] z-[300] absolute right-[-5px] top-[-5px] rounded-full bg-red-400 flex items-center justify-center"
                        >
                          <div
                            className="w-[6px] h-[1.5px] rounded-full"
                            style={{
                              backgroundColor: t.text_1,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                <div
                  className="ml-[1px] cursor-pointer hover:brightness-90 dim w-[25px] h-[25px] rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: t.background_2,
                  }}
                >
                  <FaPlus size={12} className="opacity-[0.6]" />
                </div>

                <div
                  className="cursor-pointer mt-[-0.5px] hover:brightness-90 dim w-[26px] h-[26px] rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: t.background_2,
                    border: editAssignment ? "1px solid " + t.text_3 : "none",
                  }}
                  onClick={() => setEditAssignment((prev) => !prev)}
                >
                  <FiEdit size={12} className="opacity-[0.6]" />
                </div>
              </div>

              {/* <div className="flex items-center gap-2 text-[13px] opacity-[0.45]">
                <Tag size={14} /> <span>{job.job_id ?? "—"}</span>
              </div> */}
            </div>
          </div>
        </div>

        {/* Schedule */}
        <ScheduleTimeline
          form={jobForm}
          matchedDefinition={matchedDefinition}
        />
      </div>

      {/* bottom: tasks list */}
      <div className="mt-[12px]">
        <div className="flex items-center justify-between mb-[8px]">
          <div className="text-[21px] font-semibold ml-[3px] mt-[4px]">
            Tasks
          </div>
          <div className="flex items-center gap-2 mt-[-2px]">
            <div
              onClick={() => setTasksCollapsed((prev) => !prev)}
              className="h-[30px] cursor-pointer hover:brightness-75 dim flex flex-row items-center gap-[6px] pl-[12px] pr-[8px] rounded bg-[rgba(255,255,255,0.03)]"
            >
              <div className="font-[400] text-[13px] opacity-[0.5]">
                {tasks.length} Tasks
              </div>
              <ChevronDown
                size={19}
                className={`opacity-[0.4] transition-transform duration-100 ease-in-out ${
                  !tasksCollapsed && "rotate-180"
                }`}
              />
            </div>
            <div
              onClick={addTask}
              className="cursor-pointer hover:brightness-75 dim h-[30px] flex items-center gap-2 pl-[8px] pr-[12px] rounded bg-[rgba(255,255,255,0.03)] text-[13px] font-[400]"
            >
              <Plus size={14.5} className="opacity-[0.4]" />
              <div className="font-[400] text-[13px] opacity-[0.5]">
                Add Task
              </div>
            </div>
          </div>
        </div>

        {tasksCollapsed ? (
          <div className="flex flex-col gap-3">
            {tasks.map((task_item: Task, index: number) => (
              <MiniTaskCard
                key={index}
                task={task_item}
                idx={index}
                setTasksCollapsed={setTasksCollapsed}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tasks.map((task_item: Task, index: number) => (
              <TaskCard
                key={index}
                task={task_item}
                idx={index}
                resetSignal={resetSignal}
                registerSafeRef={registerChildRef}
              />
            ))}
          </div>
        )}
      </div>
    </form>
  );
};

export default ProductJobCard;
