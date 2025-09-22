// project/src/modules/Jobs/JobCard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Activity,
  Calendar,
  Tag,
  ChevronDown,
  ChevronUp,
  User,
  CheckCircle2,
} from "lucide-react";
import { appTheme } from "@/util/appTheme";
import { AuthContext } from "@/contexts/authContext";
import { getInnerCardStyle } from "@/styles/themeStyles";
import type {
  Job,
  JobDefinition,
  Task,
  JobStatusOption,
  TaskStatusOption,
} from "@/types/jobs";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { FaPlus } from "react-icons/fa6";
import DatePicker from "react-datepicker";
import "../components/Calendar/Calendar.css";
import { BsThreeDots } from "react-icons/bs";
import { FiEdit } from "react-icons/fi";
import { useTaskForm } from "@/hooks/useJobForm";
import { TaskFormData } from "@/util/schemas/jobSchema";
import { UseFormReturn, Path, useWatch } from "react-hook-form";
import { dateToString } from "@/util/functions/Time";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useLeftBarOpenStore } from "@/store/useLeftBarOpenStore";
import { useProjectContext } from "@/contexts/projectContext";
import { useEmployeeForm } from "@/hooks/useEmployeeForm";
import {
  defaultEmployeeValues,
  EmployeeFormData,
} from "@/util/schemas/employeeSchema";
import { useAppContext } from "@/contexts/appContext";
import { Employee } from "@/types/employees";

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

// ---------- EmployeeCard ----------
const EmployeeCard: React.FC<{}> = ({}) => {
  const { currentUser } = React.useContext(AuthContext);
  const { currentEmployee } = useProjectContext();
  const { addingEmployee, employeeForm, onEmployeeFormSubmit } =
    useAppContext();
  const { employees } = useContextQueries();
  const theme = currentUser?.theme ?? "dark";
  const t = appTheme[theme];
  const leftBarOpen = useLeftBarOpenStore((state: any) => state.leftBarOpen);

  if (!employeeForm || (!currentEmployee && !addingEmployee)) return null;
  const { formState } = employeeForm;
  const { isDirty, isValid } = formState;
  const matchedEmployee = useMemo(() => {
    if (!currentEmployee) return null;
    return employees.find(
      (employee: Employee) =>
        employee.employee_id === currentEmployee.employee_id
    );
  }, [employees]);

  useEffect(() => {
    if (matchedEmployee) {
      employeeForm.reset(matchedEmployee as EmployeeFormData);
    } else {
      employeeForm.reset(defaultEmployeeValues as EmployeeFormData);
    }
  }, [matchedEmployee]);

  const onFormSubmitButton = async (data: EmployeeFormData) => {
    await onEmployeeFormSubmit(data);
  };

  useEffect(() => {
    if (addingEmployee) {
      const t = setTimeout(() => {
        employeeForm.setFocus("first_name");
      }, 0);
      return () => clearTimeout(t);
    }
  }, [addingEmployee, employeeForm]);

  const { resetTimer, cancelTimer } = useAutoSave({
    onSave: async () => {
      if (!currentEmployee) return;
      // await callSubmitForm();
    },
  });
  const callSubmitForm = async () => {
    await employeeForm.handleSubmit(onFormSubmitButton)();
  };
  useEffect(() => {
    const subscription = employeeForm.watch((values, { name, type }) => {
      if (name === "first_name" || name === "last_name") {
        if (currentEmployee) {
          resetTimer("slow");
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [employeeForm, resetTimer]);

  const threeDotsRef = useRef<HTMLDivElement | null>(null);

  // const completed = employee.status === "complete";
  // const people = ["Paul", "Dan"];
  const [deleteButtonVisible, setDeleteButtonVisible] =
    useState<boolean>(false);
  const [descriptionOpen, setDescriptionOpen] = useState<boolean>(false);
  const [editAssignment, setEditAssignment] = useState<boolean>(false);

  return (
    <form
      onSubmit={employeeForm.handleSubmit(onFormSubmitButton)}
      className={`rounded-xl relative`}
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
          // onClick={async () => {
          //   if (contextMenu && employee.employee_id) {
          //     await deleteEmployee(employee.employee_id);
          //     setCurrentEmployeeData(null)
          //   }
          // }}
          className={`${
            deleteButtonVisible
              ? "pointer-events-auto z-[501]"
              : "opacity-0 pointer-events-none"
          } transition-all duration-300 ease-in-out absolute right-[10px] top-[25px] shadow-xl z-[502] w-[100px] h-[35px] rounded-[6px] flex items-center justify-center cursor-pointer hover:brightness-90 dim`}
        >
          <div className="text-[13px] font-[500] opacity-[0.8]">
            Delete Employee
          </div>
        </div>
      </div>

      <div className="w-[100%] h-[100%] z-[300] flex-col flex items-start gap-[13px] p-3">
        <div className="w-[100%] flex items-start gap-[13px]">
          <div
            onClick={() => {
              // setDeleteButtonVisible((prev) => !prev);
            }}
            ref={threeDotsRef}
            className="absolute flex items-end flex-col z-[500] top-[6px] right-[14px] cursor-pointer hover:brightness-90 dim"
          >
            <BsThreeDots size={20} className="opacity-[0.2]" />
          </div>
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{
              background: "rgba(6,182,212,0.18)",
            }}
          >
            <User size={18} />
          </div>
          <div className="flex-1 flex flex-col min-[600px]:flex-row items-start justify-between gap-[12px]">
            <div className="flex flex-col gap-[8px] w-[100%]">
              <input
                {...employeeForm.register("first_name")}
                type="text"
                className="mt-[3px] w-[100%] text-[15px] font-[500] outline-none truncate"
                placeholder="First Name..."
              />
              <input
                {...employeeForm.register("last_name")}
                type="text"
                className="mt-[3px] w-[100%] text-[15px] font-[500] outline-none truncate"
                placeholder="Last Name..."
              />

              <div
                className={`relative rounded-[5px] transition-all duration-200 ${
                  descriptionOpen ? "h-[120px]" : "h-[30px]"
                }`}
                style={{ backgroundColor: appTheme[theme].background_2 }}
              >
                {/* <textarea
                {...taskForm.register("description")}
                onChange={(e) => {
                  resetTimer("slow");
                }}
                className="hide-scrollbar w-[calc(100%-30px)] h-[100%] text-[14px] leading-[16px] opacity-[0.7] outline-none border-none resize-none px-3 py-[6.7px]"
                placeholder="Description..."
              /> */}

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
                    {/* <DatePicker
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
                  /> */}
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
                    {/* {people.map((person: any, index: number) => {
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
                  })} */}

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
                        border: editAssignment
                          ? "1px solid " + t.text_3
                          : "none",
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
                {/* <PriorityBadge
                form={taskForm}
                cancelTimer={cancelTimer}
                callSubmitForm={callSubmitForm}
              /> */}
              </div>

              <div className="flex flex-col gap-[4px]">
                <div className="select-none ml-[4px] opacity-[0.2] text-[13px] font-[500]">
                  Status
                </div>
                {/* <TaskStatusBadge
                form={taskForm}
                matchedDefinition={matchedDefinition}
                cancelTimer={cancelTimer}
                callSubmitForm={callSubmitForm}
              /> */}
              </div>
            </div>
          </div>
        </div>
        <button
          type="submit"
          className={`${
            isDirty && isValid ? "flex" : "opacity-0 pointer-events-none"
          } cursor-pointer hover:brightness-90 dim flex flex-row items-center gap-[7px] mt-[9px] self-start px-4 py-2 rounded-full font-semibold shadow-sm text-sm`}
          style={{
            backgroundColor: t.background_2_selected,
            color: t.text_3,
          }}
        >
          <CheckCircle2 size={20} />{" "}
          <div className="text-[15px]">
            {currentEmployee ? "Save Changes" : "Add Employee"}
          </div>
        </button>
      </div>
    </form>
  );
};

const EmployeeView = () => {
  return (
    <div className="w-[100%] h-[100%] px-[22px] pt-[20px]">
      <EmployeeCard />
    </div>
  );
};

export default EmployeeView;
