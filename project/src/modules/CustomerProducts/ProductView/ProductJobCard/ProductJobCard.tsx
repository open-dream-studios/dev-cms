// project/src/modules/CustomerProducts/ProductView/ProductJobCard/ProductJobCard.tsx
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Check,
  Activity,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
import { AuthContext } from "@/contexts/authContext";
import { getCardStyle, getInnerCardStyle } from "@/styles/themeStyles";
import type {
  Job,
  JobDefinition,
  Task,
  Product,
  Customer,
  Employee,
  EmployeeAssignment,
  Media,
  MediaLink,
} from "@open-dream/shared";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { FaPlus, FaWrench } from "react-icons/fa6";
import ScheduleTimeline from "@/modules/components/Calendar/Calendar";
import DatePicker from "react-datepicker";
import "../../../components/Calendar/Calendar.css";
import { BsThreeDots, BsThreeDotsVertical } from "react-icons/bs";
import { FiEdit } from "react-icons/fi";
import { useJobForm, useTaskForm } from "@/hooks/forms/useJobForm";
import { JobFormData, TaskFormData } from "@/util/schemas/jobSchema";
import { useWatch } from "react-hook-form";
import { dateToString, formatDateTime } from "@/util/functions/Time";
import Modal2Continue from "@/modals/Modal2Continue";
import { useAutoSave } from "@/hooks/util/useAutoSave";
import AddEmployeeList from "../AddEmployeeList";
import CircularProgress from "./CircularProgress";
import { PriorityBadge, StatusBadge, TaskStatusBadge } from "./Badges";
import {
  setCurrentEmployeeData,
  setCurrentMediaSelected,
  useCurrentDataStore,
} from "@/store/currentDataStore";
import { useRouting } from "@/hooks/useRouting";
import { useCurrentTheme } from "@/hooks/util/useTheme";
import ImageGallery from "@/modules/components/ImageGallery";
import { setUploadContext, useUiStore } from "@/store/useUIStore";
import { saveCurrentJobImages } from "@/modules/MediaModule/_actions/media.actions";

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
  const {
    upsertTask,
    deleteTask,
    employeeAssignments,
    employees,
    deleteEmployeeAssignment,
  } = useContextQueries();
  const { screenClick } = useRouting();
  const currentTheme = useCurrentTheme();

  const { leftBarOpen, modal1, setModal1 } = useUiStore();

  const taskForm = useTaskForm();
  const taskStatus = useWatch({ control: taskForm.control, name: "status" });

  const scheduled_start_date = useWatch({
    control: taskForm.control,
    name: "scheduled_start_date",
  });

  useEffect(() => {
    if (!task?.task_id) return;
    const currentValues = taskForm.getValues();
    const isSame =
      currentValues.task === task.task &&
      currentValues.description === task.description &&
      currentValues.status === task.status &&
      currentValues.priority === task.priority;
    if (!isSame) {
      taskForm.reset(task as TaskFormData);
    }
  }, [taskForm, task]);

  const onFormSubmitButton = useCallback(
    async (data: TaskFormData) => {
      if (!productJob) return;
      const submitValue = {
        ...data,
        task_id: task.task_id,
        job_id: productJob.id,
        scheduled_start_date: dateToString(data.scheduled_start_date ?? null),
      } as Task;
      await upsertTask(submitValue);
    },
    [productJob, task, upsertTask]
  );

  const { resetTimer, cancelTimer } = useAutoSave({
    onSave: async () => {
      await callSubmitForm();
    },
  });

  const callSubmitForm = useCallback(() => {
    taskForm.handleSubmit(onFormSubmitButton)(); // no await
  }, [taskForm, onFormSubmitButton]);

  useEffect(() => {
    const subscription = taskForm.watch((values, { name, type }) => {
      if (name === "task" || name === "description") {
        resetTimer("slow");
      }
    });
    return () => subscription.unsubscribe();
  }, [taskForm, resetTimer]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      callSubmitForm();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [callSubmitForm]);

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
    setEditAssignment(false);
  };

  if (!currentUser || !productJob || !matchedDefinition) return null;

  if (tasksCollapsed)
    return (
      <form
        onSubmit={taskForm.handleSubmit(onFormSubmitButton)}
        className={`${
          taskStatus === "cancelled" && "opacity-[0.5]"
        } cursor-pointer hover:brightness-[86%] dim rounded-xl relative`}
        style={getInnerCardStyle(currentUser.theme, currentTheme)}
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
                    oneSize={true}
                  />
                </div>

                <div className="flex flex-col gap-[4px]">
                  <TaskStatusBadge
                    form={taskForm}
                    matchedDefinition={matchedDefinition}
                    cancelTimer={cancelTimer}
                    callSubmitForm={callSubmitForm}
                    oneSize={true}
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
        ...getInnerCardStyle(currentUser.theme, currentTheme),
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
            border: "1px solid " + currentTheme.background_3,
            backgroundColor: currentTheme.background_2,
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
              style={{ backgroundColor: currentTheme.background_2 }}
            >
              <textarea
                {...taskForm.register("description", {
                  onChange: (e) => {
                    resetTimer("slow");
                  },
                })}
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
                      currentUser.theme === "dark"
                        ? "text-[#999] border-[#3d3d3d] border-[1px]"
                        : "text-black border-[#111] border-[0.5px]"
                    }`}
                    calendarClassName={
                      currentUser.theme === "dark"
                        ? "datepicker-dark"
                        : "datepicker-light"
                    }
                    popperClassName={
                      currentUser.theme === "dark"
                        ? "datepicker-dark"
                        : "datepicker-light"
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
                            onClick={async () => {
                              await screenClick("employees", "/");
                              setCurrentEmployeeData(matchingEmployee);
                            }}
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
                                backgroundColor: currentTheme.background_4,
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
                                  backgroundColor: currentTheme.text_1,
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
                      backgroundColor: currentTheme.background_2,
                    }}
                    onClick={handleAddAssignmentClick}
                  >
                    <FaPlus size={12} className="opacity-[0.6]" />
                  </div>

                  {employeeAssignments.filter(
                    (assignment: EmployeeAssignment) =>
                      assignment.task_id === task.task_id
                  ).length > 0 && (
                    <div
                      className="cursor-pointer mt-[-0.5px] hover:brightness-90 dim w-[26px] h-[26px] rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: currentTheme.background_2,
                        border: editAssignment
                          ? "1px solid " + currentTheme.text_3
                          : "none",
                      }}
                      onClick={() => setEditAssignment((prev) => !prev)}
                    >
                      <FiEdit size={12} className="opacity-[0.6]" />
                    </div>
                  )}
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
                oneSize={true}
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
                oneSize={true}
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
    customers,
    mediaLinks,
    upsertMediaLinks,
    deleteMediaLinks,
  } = useContextQueries();
  const { screenClick } = useRouting();
  const { setCurrentJobImages, currentJobImages } = useCurrentDataStore();
  const currentTheme = useCurrentTheme();

  const { leftBarOpen, modal1, setModal1, modal2, setModal2 } = useUiStore();
  const jobForm = useJobForm();
  const status = useWatch({ control: jobForm.control, name: "status" });

  // This replaces your old reset effect
  useEffect(() => {
    if (!productJob) return;

    const current = jobForm.getValues();

    const isSame =
      current.notes === (productJob.notes ?? "") &&
      current.valuation === (productJob.valuation ?? null)?.toString() &&
      dateToString(current.scheduled_start_date ?? null) ===
        dateToString(productJob.scheduled_start_date ?? null) &&
      dateToString(current.completed_date ?? null) ===
        dateToString(productJob.completed_date ?? null) &&
      current.status === productJob.status &&
      current.priority === productJob.priority;

    if (!isSame) {
      jobForm.reset({
        ...productJob,
        valuation: productJob.valuation?.toString() ?? null,
        scheduled_start_date: productJob.scheduled_start_date
          ? new Date(productJob.scheduled_start_date)
          : null,
        completed_date: productJob.completed_date
          ? new Date(productJob.completed_date)
          : null,
      });
    }
  }, [productJob, jobForm]);

  const onFormSubmitButton = useCallback(
    async (data: JobFormData) => {
      console.log("saving");
      if (!matchedDefinition || !productJob) return null;

      const safeValuation = (() => {
        if (!data.valuation) return 0;
        const num = parseFloat(data.valuation);
        return isNaN(num) ? 0 : num;
      })();

      const matchedCustomer =
        matchedProduct && matchedProduct.customer_id
          ? customers.find(
              (customer: Customer) => customer.id === matchedProduct.customer_id
            )
          : null;

      const submitValue = {
        ...data,
        scheduled_start_date: dateToString(data.scheduled_start_date ?? null),
        completed_date: dateToString(data.completed_date ?? null),
        valuation: safeValuation,
        job_id: productJob.job_id,
        job_definition_id: matchedDefinition.id,
        product_id: matchedProduct?.id ?? null,
        customer_id: matchedCustomer?.id ?? null,
      } as Job;

      console.log("upserting", submitValue);

      await upsertJob(submitValue);
    },
    [matchedDefinition, productJob, matchedProduct, customers, upsertJob]
  );

  const callSubmitForm = useCallback(async () => {
    await jobForm.handleSubmit(onFormSubmitButton, (errors) => {
      console.error("Submit blocked by validation errors:", errors);
    })();
  }, [jobForm, onFormSubmitButton]);

  const { resetTimer, cancelTimer } = useAutoSave({
    onSave: async () => {
      await callSubmitForm();
    },
  });

  useEffect(() => {
    const handleBeforeUnload = () => {
      callSubmitForm();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [callSubmitForm]);

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
  }, [tasks, productJob]);

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
    if (!mediaLinks || !productJob) return;
    const loadedLinks = mediaLinks.filter(
      (link: MediaLink) =>
        link.entity_id === productJob.id && link.entity_type === "job"
    );
    setCurrentJobImages(loadedLinks);
  }, [productJob, mediaLinks, setCurrentJobImages]);

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
    setEditAssignment(false);
  };

  if (!matchedDefinition || !productJob) return null;
  if (!currentUser) return null;

  return (
    <div
      className={`${
        status === "cancelled" && "opacity-[0.5]"
      } w-[100%] rounded-2xl px-[16px] pt-[14px]`}
      style={getCardStyle(currentUser.theme, currentTheme)}
      ref={parentRef}
    >
      <form
        onSubmit={jobForm.handleSubmit(onFormSubmitButton)}
        className="flex flex-col w-[100%]"
      >
        <div
          className={`flex flex-col gap-[15px] min-[750px]:flex-row min-[870px]:flex-col min-[990px]:flex-row ${
            leftBarOpen ? "min-[1024px]:flex-col min-[1220px]:flex-row" : ""
          } items-start justify-between w-full`}
        >
          <div className="flex items-center gap-[15px]">
            <div
              className="p-3 rounded-xl shadow-sm"
              style={{
                backgroundColor: currentTheme.background_3,
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
                style={{ color: currentTheme.text_1 }}
              />
            </div>

            <div className="flex flex-col mt-[6px]">
              <div className="mt-[0px] flex flex-row gap-[5px] items-center">
                <div
                  style={{ color: currentTheme.text_1 }}
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
                        backgroundColor: currentTheme.delete,
                      }}
                      onClick={async () => {
                        if (productJob.job_id) {
                          handleDeleteJob(productJob.job_id);
                        }
                      }}
                      className="absolute right-0 top-[-6px] shadow-xl z-[502] w-[90px] h-[27px] rounded-[6px] flex items-center justify-center cursor-pointer hover:brightness-90 dim"
                    >
                      <div className="text-[12.5px] font-[500] opacity-[0.9] text-[#fff]">
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
                  oneSize={true}
                />
              </div>
            </div>
          </div>

          <div
            className="flex items-center gap-[15px] py-[6.5px] px-[12px] rounded-[10px]"
            style={getInnerCardStyle(currentUser.theme, currentTheme)}
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
                oneSize={true}
              />
            </div>
            <CircularProgress
              value={progressPct}
              size={55}
              stroke={8}
              color={progressPct >= 100 ? "#22c55e" : "#06b6d4"}
              bg={
                currentUser.theme === "dark"
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(0,0,0,0.05)"
              }
            />
          </div>
        </div>

        {matchedDefinition.type === "Sale" && (
          <div
            className={`flex items-center mt-[11px] min-[750px]:mt-0 min-[870px]:mt-[11px] min-[990px]:mt-0 ${
              leftBarOpen ? "min-[1024px]:mt-[11px] min-[1220px]:mt-0" : ""
            }`}
          >
            <p className="opacity-[0.4] mr-[10px] text-[15px] font-[500]">
              Sale Price
            </p>
            <div
              style={{
                backgroundColor: currentTheme.background_2,
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
        <div className="w-[100%] h-auto mt-[13.5px] gap-[12.5px] flex flex-col">
          <div className="flex flex-col gap-[12px] w-[100%]">
            <div
              className="rounded-xl px-[15px] pt-[11px] pb-[10px] w-[100%]"
              style={getInnerCardStyle(currentUser.theme, currentTheme)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div
                    className="text-[15px] font-[600] ml-[3px]"
                    style={{ color: currentTheme.text_2 }}
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
                      style={{ color: currentTheme.text_1 }}
                    >
                      {formatDateTime(productJob.updated_at)}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-[10.5px]">
                <div
                  className={`relative rounded-[8px] transition-all duration-200 ${
                    noteOpen ? "h-[210px]" : "h-[99px]"
                  }`}
                  style={{ backgroundColor: currentTheme.background_2 }}
                >
                  <textarea
                    {...jobForm.register("notes")}
                    onChange={(e) => {
                      jobForm.setValue("notes", e.target.value, {
                        shouldDirty: true,
                      });
                      resetTimer("slow");
                    }}
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
                  style={{ color: currentTheme.text_2 }}
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
                            onClick={async () => {
                              await screenClick("employees", "/");
                              setCurrentEmployeeData(matchingEmployee);
                            }}
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
                                backgroundColor: currentTheme.background_4,
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
                                  backgroundColor: currentTheme.text_1,
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
                      backgroundColor: currentTheme.background_2,
                    }}
                    onClick={handleAddAssignmentClick}
                  >
                    <FaPlus size={12} className="opacity-[0.6]" />
                  </div>

                  {employeeAssignments.filter(
                    (assignment: EmployeeAssignment) =>
                      assignment.job_id === productJob.job_id
                  ).length > 0 && (
                    <div
                      className="cursor-pointer mt-[-0.5px] hover:brightness-90 dim w-[26px] h-[26px] rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: currentTheme.background_2,
                        border: editAssignment
                          ? "1px solid " + currentTheme.text_3
                          : "none",
                      }}
                      onClick={() => setEditAssignment((prev) => !prev)}
                    >
                      <FiEdit size={12} className="opacity-[0.6]" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              className={`${
                currentJobImages.length
                  ? "h-[95px] pt-[3px] pb-[11px]"
                  : "h-[48px] py-[7px]"
              } w-[100%] px-[15px] rounded-xl flex flex-row gap-[11px]`}
              style={getInnerCardStyle(currentUser.theme, currentTheme)}
            >
              <div
                className={`${
                  currentJobImages.length && "pt-[8px]"
                } h-[100%] cursor-pointer hover:brightness-[95%] dim flex flex-row gap-[11px] items-center`}
                onClick={async () => {
                  setUploadContext({
                    visible: true,
                    multiple: true,
                    folder_id: null,
                    usage: "job",
                    onUploaded: async (uploads: Media[], files: File[]) => {
                      const newMediaLinks: MediaLink[] = uploads
                        .filter(
                          (m): m is Media & { id: number } => m.id != null
                        )
                        .map((m, index) => ({
                          entity_type: "job",
                          entity_id: productJob.id ? productJob.id : null,
                          media_id: m.id,
                          url: m.url,
                          ordinal: currentJobImages.length + index,
                        }));
                      await upsertMediaLinks(newMediaLinks);
                    },
                  });
                }}
              >
                <div
                  className={`h-[100%] aspect-[1/1] rounded-[8px] flex items-center justify-center`}
                  style={{ backgroundColor: currentTheme.background_2 }}
                >
                  <FaPlus
                    className="opacity-[0.5]"
                    size={currentJobImages.length ? 23 : 16}
                  />
                </div>

                {currentJobImages.length === 0 && (
                  <div className="text-[15px] font-[600] opacity-[0.5]">
                    Add Media
                  </div>
                )}
              </div>

              {currentJobImages.length > 0 && (
                <div
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  className="w-[100%] max-w-[100%] h-[100%] overflow-x-auto pt-[8px]"
                >
                  <ImageGallery
                    enableReorder={true}
                    onReorder={async (reordered: MediaLink[]) => {
                      if (productJob.id) {
                        await saveCurrentJobImages(productJob.id, reordered);
                      }
                    }}
                    editMediaLinks={true}
                    onDeleteLink={async (link: MediaLink) => {
                      await deleteMediaLinks([link]);
                    }}
                    singleRow={true}
                    entityType="job"
                    onMediaClick={async (img: Media) =>
                      setCurrentMediaSelected(img)
                    }
                  />
                </div>
              )}
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
