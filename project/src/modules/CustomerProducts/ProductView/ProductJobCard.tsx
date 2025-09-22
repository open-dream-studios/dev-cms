// project/src/modules/Jobs/JobCard.tsx
import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { useJobForm, useTaskForm } from "@/hooks/useJobForm";
import { JobFormData, TaskFormData } from "@/util/schemas/jobSchema";
import { UseFormReturn, Path, useWatch } from "react-hook-form";
import { Product } from "@/types/products";
import { dateToString, formatDateTime } from "@/util/functions/Time";
import Modal2Continue from "@/modals/Modal2Continue";
import { useModal1Store, useModal2Store } from "@/store/useModalStore";
import { DelayType, useAutoSave } from "@/hooks/useAutoSave";
import { useLeftBarOpenStore } from "@/store/useLeftBarOpenStore";
import AddEmployeeList from "./AddEmployeeList";
import { Employee, EmployeeAssignment } from "@/types/employees";

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
  matchedDefinition: JobDefinition | null;
  cancelTimer: () => void;
  callSubmitForm: () => void;
}> = ({ form, matchedDefinition, cancelTimer, callSubmitForm }) => {
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
        {...form.register("status", {
          onChange: async () => {
            cancelTimer();
            await callSubmitForm();
          },
        })}
        className="brightness-[140%] pl-[24px] pr-[5px] rounded-full ml-[-26px] cursor-pointer py-2 text-sm outline-none border-none"
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
const TaskStatusBadge: React.FC<{
  form: UseFormReturn<TaskFormData> | null;
  matchedDefinition: JobDefinition | null;
  cancelTimer: () => void;
  callSubmitForm: () => void;
}> = ({ form, matchedDefinition, cancelTimer, callSubmitForm }) => {
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
        {...form.register("status", {
          onChange: async () => {
            cancelTimer();
            await callSubmitForm();
          },
        })}
        className="brightness-[140%] pl-[22px] pr-[5px] rounded-full ml-[-26px] cursor-pointer h-[25px] text-[13px] outline-none border-none"
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
    </div>
  );
};

// ---------- PriorityBadge ----------
type PriorityBadgeForm = {
  priority: "low" | "medium" | "high" | "urgent";
  status: JobStatusOption | TaskStatusOption;
};

const PriorityBadge = <T extends PriorityBadgeForm>({
  form,
  cancelTimer,
  callSubmitForm,
}: {
  form: UseFormReturn<T> | null;
  cancelTimer: () => void;
  callSubmitForm: () => void;
}) => {
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
        className="cursor-pointer font-[500] outline-none border-none rounded-full pl-[10px] min-w-[80px] w-[100%] h-[25px] text-[13px] opacity-[0.95]"
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
  productJob: Job | null;
  matchedDefinition: JobDefinition | null;
  index: number;
  resetSignal: number;
  registerSafeRef: (ref: HTMLElement | null) => void;
  tasksCollapsed: boolean;
  setTasksCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({
  task,
  productJob,
  matchedDefinition,
  index,
  resetSignal,
  registerSafeRef,
  tasksCollapsed,
  setTasksCollapsed,
}) => {
  const { currentUser } = React.useContext(AuthContext);
  const { upsertTask, deleteTask, employeeAssignments, employees, deleteEmployeeAssignment } =
    useContextQueries();
  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];
  const leftBarOpen = useLeftBarOpenStore((state: any) => state.leftBarOpen);
  const modal1 = useModal1Store((state: any) => state.modal1);
  const setModal1 = useModal1Store((state: any) => state.setModal1);

  if (!productJob || !matchedDefinition) return null;

  const taskForm = useTaskForm();
  const taskStatus = useWatch({ control: taskForm.control, name: "status" });

  const scheduled_start_date = useWatch({
    control: taskForm.control,
    name: "scheduled_start_date",
  });

  useEffect(() => {
    if (task?.task_id) {
      taskForm.reset(task as TaskFormData);
    }
  }, [task?.task_id]);

  const onFormSubmitButton = async (data: TaskFormData) => {
    const submitValue = {
      ...data,
      task_id: task.task_id,
      job_id: productJob.id,
      scheduled_start_date: dateToString(data.scheduled_start_date ?? null),
    } as Task;
    await upsertTask(submitValue);
  };

  const { resetTimer, cancelTimer } = useAutoSave({
    onSave: async () => {
      await callSubmitForm();
    },
  });
  const callSubmitForm = async () => {
    await taskForm.handleSubmit(onFormSubmitButton)();
  };
  useEffect(() => {
    const subscription = taskForm.watch((values, { name, type }) => {
      if (name === "task" || name === "description") {
        resetTimer("slow");
      }
    });
    return () => subscription.unsubscribe();
  }, [taskForm, resetTimer]);

  const threeDotsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    registerSafeRef(threeDotsRef.current);
  }, [registerSafeRef]);

  useEffect(() => {
    setDeleteButtonVisible(false);
  }, [resetSignal]);

  const completed = task.status === "complete";

  const [deleteButtonVisible, setDeleteButtonVisible] =
    useState<boolean>(false);
  const [descriptionOpen, setDescriptionOpen] = useState<boolean>(false);
  const [editAssignment, setEditAssignment] = useState<boolean>(false);

  const handleAddAssignmentClick = () => {
    if (!productJob) return;
    setModal1({
      ...modal1,
      open: !modal1.open,
      showClose: true,
      offClickClose: true,
      width: "w-[90vw] md:w-[80vw]",
      maxWidth: "md:max-w-[1000px]",
      aspectRatio: "aspect-[2/2.1] md:aspect-[3/2]",
      borderRadius: "rounded-[15px] md:rounded-[20px]",
      content: <AddEmployeeList assignment={task ?? null} />,
    });
  };

  if (tasksCollapsed)
    return (
      <form
        onSubmit={taskForm.handleSubmit(onFormSubmitButton)}
        className={`${
          taskStatus === "cancelled" && "opacity-[0.5]"
        } cursor-pointer hover:brightness-[86%] dim rounded-xl relative`}
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
                  {task.task && task.task.trim().length > 0
                    ? task.task
                    : `Task ${index + 1}`}
                </div>
              </div>

              <div className="flex items-center flex-row gap-[10px] mt-[2.5px]">
                <div className="flex flex-col gap-[4px]">
                  <PriorityBadge
                    form={taskForm}
                    cancelTimer={cancelTimer}
                    callSubmitForm={callSubmitForm}
                  />
                </div>

                <div className="flex flex-col gap-[4px]">
                  <TaskStatusBadge
                    form={taskForm}
                    matchedDefinition={matchedDefinition}
                    cancelTimer={cancelTimer}
                    callSubmitForm={callSubmitForm}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    );

  return (
    <form
      onSubmit={taskForm.handleSubmit(onFormSubmitButton)}
      className={`${
        taskStatus === "cancelled" && "opacity-[0.5]"
      } rounded-xl relative`}
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
          onClick={async () => {
            if (task.task_id) {
              await deleteTask(task.task_id);
            }
          }}
          className={`${
            deleteButtonVisible
              ? "pointer-events-auto z-[501]"
              : "opacity-0 pointer-events-none"
          } transition-all duration-300 ease-in-out absolute right-[10px] top-[25px] shadow-xl z-[502] w-[100px] h-[35px] rounded-[6px] flex items-center justify-center cursor-pointer hover:brightness-90 dim`}
        >
          <div className="text-[13px] font-[500] opacity-[0.8]">
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
        <div className="flex-1 flex flex-col min-[600px]:flex-row items-start justify-between gap-[12px]">
          <div className="flex flex-col gap-[8px] w-[100%]">
            <input
              {...taskForm.register("task")}
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
                {...taskForm.register("description")}
                onChange={(e) => {
                  resetTimer("slow");
                }}
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

            <div
              className={`flex w-[100%] mt-[1px] gap-[8px] flex-col-reverse min-[1000px]:flex-row ${
                leftBarOpen
                  ? "min-[1024px]:flex-col-reverse min-[1300px]:flex-row"
                  : ""
              }`}
            >
              <div className="flex flex-row gap-[8px]">
                <Calendar
                  size={15}
                  className="opacity-[0.4] min-w-[15px] mt-[6px]"
                />
                <div className="min-w-[100px] relative">
                  <DatePicker
                    selected={scheduled_start_date}
                    onChange={async (date: Date | null) => {
                      if (!date) return;
                      const dateTime = new Date(date);
                      dateTime.setHours(12, 0, 0, 0);
                      taskForm.setValue("scheduled_start_date", dateTime);
                      cancelTimer();
                      await callSubmitForm();
                    }}
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
              </div>

              <div
                className={`flex gap-[8px] w-[100%] flex-col min-[700px]:flex-row ${
                  leftBarOpen
                    ? "min-[1024px]:flex-col min-[1070px]:flex-row"
                    : "min-[1070px]:flex-row"
                }`}
              >
                <div className="ml-[9px] mt-[4px] mr-[3px] opacity-[0.6] text-[12px] font-[500]">
                  Assignment
                </div>

                <div className="w-[100%] flex-wrap gap-[8px] flex flex-row mt-[1px]">
                  {employeeAssignments
                    .filter(
                      (assignment: EmployeeAssignment) =>
                        assignment.task_id === task.task_id
                    )
                    .map((assignment: EmployeeAssignment, index: number) => {
                      const matchingEmployee = employees.find(
                        (employee: Employee) =>
                          employee.employee_id === assignment.employee_id
                      );
                      if (!matchingEmployee) return;
                      let displayName = matchingEmployee.first_name;
                      if (
                        employees.filter(
                          (employee: Employee) =>
                            employee.first_name === matchingEmployee.first_name
                        ).length > 1 &&
                        matchingEmployee.last_name &&
                        matchingEmployee.last_name.length > 0
                      ) {
                        displayName =
                          matchingEmployee.first_name +
                          matchingEmployee.last_name[0];
                      }
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
                              {displayName}
                            </div>
                          </div>
                          {editAssignment && (
                            <div
                              style={{
                                backgroundColor: t.background_4,
                              }}
                              onClick={async () => {
                                if (assignment.id) {
                                  await deleteEmployeeAssignment(assignment.id);
                                }
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
                    onClick={handleAddAssignmentClick}
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
          </div>

          <div
            className={`flex gap-[10px] ${
              leftBarOpen
                ? "flex-col-reverse min-[1400px]:flex-row min-[1400px]:items-center"
                : "flex-col-reverse min-[1090px]:flex-row min-[1090px]:items-center"
            }`}
          >
            <div className="flex flex-col gap-[4px]">
              <div className="select-none ml-[3px] opacity-[0.2] text-[13px] font-[500]">
                Priority
              </div>
              <PriorityBadge
                form={taskForm}
                cancelTimer={cancelTimer}
                callSubmitForm={callSubmitForm}
              />
            </div>

            <div className="flex flex-col gap-[4px]">
              <div className="select-none ml-[4px] opacity-[0.2] text-[13px] font-[500]">
                Status
              </div>
              <TaskStatusBadge
                form={taskForm}
                matchedDefinition={matchedDefinition}
                cancelTimer={cancelTimer}
                callSubmitForm={callSubmitForm}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
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
  const {
    tasks,
    upsertTask,
    deleteJob,
    upsertJob,
    employees,
    employeeAssignments,
    deleteEmployeeAssignment,
  } = useContextQueries();
  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];

  const modal1 = useModal1Store((state: any) => state.modal1);
  const setModal1 = useModal1Store((state: any) => state.setModal1);
  const modal2 = useModal2Store((state: any) => state.modal2);
  const setModal2 = useModal2Store((state: any) => state.setModal2);
  const leftBarOpen = useLeftBarOpenStore((state: any) => state.leftBarOpen);

  if (!matchedDefinition || !productJob) return null;

  useEffect(() => {
    if (productJob?.job_id) {
      jobForm.reset(productJob as JobFormData);
    }
  }, [productJob?.job_id]);

  const jobForm = useJobForm();
  const status = useWatch({ control: jobForm.control, name: "status" });

  const onFormSubmitButton = async (data: JobFormData) => {
    const safeValuation = (() => {
      if (!data.valuation) return 0;
      const num = parseFloat(data.valuation);
      return isNaN(num) ? 0 : num;
    })();

    const submitValue = {
      ...data,
      scheduled_start_date: dateToString(data.scheduled_start_date ?? null),
      completed_date: dateToString(data.completed_date ?? null),
      valuation: safeValuation,
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

  const { resetTimer, cancelTimer } = useAutoSave({
    onSave: async () => {
      await callSubmitForm();
    },
  });
  const callSubmitForm = async () => {
    await jobForm.handleSubmit(onFormSubmitButton, (errors) => {
      console.error("Submit blocked by validation errors:", errors);
    })();
  };
  useEffect(() => {
    const subscription = jobForm.watch((values, { name, type }) => {
      if (name === "valuation" || name === "notes") {
        resetTimer("slow");
      }
    });
    return () => subscription.unsubscribe();
  }, [jobForm, resetTimer]);

  const jobTasks = useMemo(() => {
    if (!productJob) return [];
    return tasks.filter((task: Task) => task.job_id === productJob.id);
  }, [tasks]);

  const progressPct = useMemo(() => {
    const completedCount = jobTasks.filter(
      (t) => t.status === "complete"
    ).length;
    return Math.round((completedCount / Math.max(1, jobTasks.length)) * 100);
  }, [jobTasks]);

  const [noteOpen, setNoteOpen] = useState(false);
  const [tasksCollapsed, setTasksCollapsed] = useState(false);
  const [editAssignment, setEditAssignment] = useState<boolean>(false);
  const [deleteButtonVisible, setDeleteButtonVisible] =
    useState<boolean>(false);
  const [resetSignal, setResetSignal] = useState<number>(0);
  const parentRef = useRef<HTMLDivElement | null>(null);
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

  const addTask = async () => {
    if (!productJob) return;
    await upsertTask({
      task_id: null,
      job_id: productJob.id,
      status: "waiting_work",
      priority: "medium",
      scheduled_start_date: dateToString(new Date()),
      task: "",
      description: "",
    } as Task);
    setTasksCollapsed(false);
  };

  const handleDeleteJob = (job_id: string) => {
    setModal2({
      ...modal2,
      open: !modal2.open,
      showClose: false,
      offClickClose: true,
      width: "w-[300px]",
      maxWidth: "max-w-[400px]",
      aspectRatio: "aspect-[5/2]",
      borderRadius: "rounded-[12px] md:rounded-[15px]",
      content: (
        <Modal2Continue
          text={`Permanently delete this job?`}
          onContinue={async () => await deleteJob(job_id)}
          threeOptions={false}
        />
      ),
    });
  };

  const calendarContainerRef = useRef<HTMLDivElement | null>(null);

  const handleAddAssignmentClick = () => {
    if (!productJob) return;
    setModal1({
      ...modal1,
      open: !modal1.open,
      showClose: true,
      offClickClose: true,
      width: "w-[90vw] md:w-[80vw]",
      maxWidth: "md:max-w-[1000px]",
      aspectRatio: "aspect-[2/2.1] md:aspect-[3/2]",
      borderRadius: "rounded-[15px] md:rounded-[20px]",
      content: <AddEmployeeList assignment={productJob ?? null} />,
    });
  };

  if (!currentUser) return null;

  return (
    <div
      className={`${
        status === "cancelled" && "opacity-[0.5]"
      } w-[100%] rounded-2xl px-[16px] pt-[14px]`}
      style={getCardStyle(theme, t)}
      ref={parentRef}
    >
      <form
        onSubmit={jobForm.handleSubmit(onFormSubmitButton)}
        className="flex flex-col"
      >
        {/* TOP ROW */}
        <div
          className={`flex flex-col gap-[15px] min-[750px]:flex-row min-[870px]:flex-col min-[990px]:flex-row ${
            leftBarOpen ? "min-[1024px]:flex-col min-[1220px]:flex-row" : ""
          } items-start justify-between w-full`}
        >
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
              <div className="mt-[0px] flex flex-row gap-[5px] items-center">
                <div
                  style={{ color: t.text_1 }}
                  className="text-[20px] leading-[24px] font-semibold mt-[-5px]"
                >
                  {matchedDefinition.type} {" Job"}
                </div>
                <div className="relative flex flex-row gap-[3px] items-center mt-[-5px] w-[110px]">
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
                  {deleteButtonVisible && (
                    <div
                      style={{
                        border: "1px solid " + t.background_3,
                        backgroundColor: t.delete,
                      }}
                      onClick={async () => {
                        if (productJob.job_id) {
                          handleDeleteJob(productJob.job_id);
                        }
                      }}
                      className="absolute right-0 top-[-6px] shadow-xl z-[502] w-[90px] h-[27px] rounded-[6px] flex items-center justify-center cursor-pointer hover:brightness-90 dim"
                    >
                      <div className="text-[12.5px] font-[500] opacity-[0.8]">
                        Delete Job
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-[5.5px] flex items-center gap-2">
                <div className="opacity-[0.4] mt-[-3px] text-[15px] font-medium">
                  Priority
                </div>
                <PriorityBadge
                  form={jobForm}
                  cancelTimer={cancelTimer}
                  callSubmitForm={callSubmitForm}
                />
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
              <StatusBadge
                form={jobForm}
                matchedDefinition={matchedDefinition}
                cancelTimer={cancelTimer}
                callSubmitForm={callSubmitForm}
              />
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
          <div
            className={`flex items-center mt-[11px] min-[750px]:mt-0 min-[870px]:mt-[11px] min-[990px]:mt-0 ${
              leftBarOpen ? "min-[1024px]:mt-[11px] min-[1220px]:mt-0" : ""
            }`}
          >
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
                  setValueAs: (v) => (v === "" ? null : String(v)), // always string or null
                })}
                inputMode="decimal"
                type="text"
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
                  {employeeAssignments
                    .filter(
                      (assignment: EmployeeAssignment) =>
                        assignment.job_id === productJob.job_id
                    )
                    .map((assignment: EmployeeAssignment, index: number) => {
                      const matchingEmployee = employees.find(
                        (employee: Employee) =>
                          employee.employee_id === assignment.employee_id
                      );
                      if (!matchingEmployee) return;
                      let displayName = matchingEmployee.first_name;
                      if (
                        employees.filter(
                          (employee: Employee) =>
                            employee.first_name === matchingEmployee.first_name
                        ).length > 1 &&
                        matchingEmployee.last_name &&
                        matchingEmployee.last_name.length > 0
                      ) {
                        displayName =
                          matchingEmployee.first_name +
                          matchingEmployee.last_name[0];
                      }
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
                              {displayName}
                            </div>
                          </div>
                          {editAssignment && (
                            <div
                              style={{
                                backgroundColor: t.background_4,
                              }}
                              onClick={async () => {
                                if (assignment.id) {
                                  await deleteEmployeeAssignment(assignment.id);
                                }
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
                    onClick={handleAddAssignmentClick}
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
          </div>

          <div ref={calendarContainerRef} className="w-[100%]">
            <ScheduleTimeline
              form={jobForm}
              matchedDefinition={matchedDefinition}
              cancelTimer={cancelTimer}
              callSubmitForm={callSubmitForm}
              calendarContainerRef={calendarContainerRef}
            />
          </div>
        </div>
      </form>

      {/* Tasks list */}
      <div className="mt-[12px] pb-[6px]">
        <div className="flex items-center justify-between mb-[8px]">
          <div className="text-[21px] font-semibold ml-[3px] mt-[4px]">
            Tasks
          </div>
          <div className="flex items-center gap-2 mt-[-2px]">
            {jobTasks.length > 0 && (
              <div
                onClick={() => setTasksCollapsed((prev) => !prev)}
                className="h-[30px] cursor-pointer hover:brightness-75 dim flex flex-row items-center gap-[6px] pl-[12px] pr-[8px] rounded bg-[rgba(255,255,255,0.03)]"
              >
                <div className="font-[400] text-[13px] opacity-[0.5]">
                  {jobTasks.length} Tasks
                </div>
                <ChevronDown
                  size={19}
                  className={`opacity-[0.4] transition-transform duration-100 ease-in-out ${
                    !tasksCollapsed && "rotate-180"
                  }`}
                />
              </div>
            )}
            <div
              onClick={addTask}
              className="cursor-pointer hover:brightness-75 dim h-[30px] flex items-center gap-2 pl-[8px] pr-[12px] rounded bg-[rgba(255,255,255,0.03)] text-[13px] font-[400]"
            >
              <Plus
                size={14.5}
                className={`${jobTasks.length > 0 && "opacity-[0.4]"}`}
              />
              <div
                className={`font-[400] text-[13px] ${
                  jobTasks.length > 0 && "opacity-[0.5]"
                }`}
              >
                Add Task
              </div>
            </div>
          </div>
        </div>

        {jobTasks.length > 0 && (
          <div className="flex flex-col gap-3 mb-[10px]">
            {jobTasks.map((task_item: Task, index: number) => (
              <TaskCard
                key={index}
                task={task_item}
                matchedDefinition={matchedDefinition}
                index={index}
                productJob={productJob}
                resetSignal={resetSignal}
                registerSafeRef={registerChildRef}
                tasksCollapsed={tasksCollapsed}
                setTasksCollapsed={setTasksCollapsed}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductJobCard;
