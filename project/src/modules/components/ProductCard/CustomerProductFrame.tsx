// project/src/modules/CustomerProducts/ProductCard/ProductFrame.tsx
"use client";
import { AuthContext } from "@/contexts/authContext";
import React, { useContext, useEffect, useMemo } from "react";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import {
  MediaLink,
  Product,
  Customer,
  Job,
  JobDefinition,
  Task,
  Media,
} from "@open-dream/shared";
import CustomerTag from "./CustomerTag";
import { getCardStyle, getInnerCardStyle } from "@/styles/themeStyles";
import { Check, Activity } from "lucide-react";
import { FaWrench } from "react-icons/fa6";
import "../../components/Calendar/Calendar.css";
import { useJobForm, useTaskForm } from "@/hooks/forms/useJobForm";
import { JobFormData, TaskFormData } from "@/util/schemas/jobSchema";
import { useWatch } from "react-hook-form";
import { dateToString } from "@/util/functions/Time";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useLeftBarOpenStore } from "@/store/useLeftBarOpenStore";
import {
  PriorityBadge,
  StatusBadge,
  TaskStatusBadge,
} from "../../CustomerProducts/ProductView/ProductJobCard/Badges";
import { useUiStore } from "@/store/useUIStore";
import { useRouting } from "@/hooks/useRouting";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useCurrentTheme } from "@/hooks/useTheme";
import RenderedImage from "./RenderedImage";
import NoProductImage from "./NoProductImage";

// ---------- TaskCard ----------
const MiniTaskCard: React.FC<{
  task: Task;
  productJob: Job | null;
  matchedDefinition: JobDefinition | null;
  index: number;
}> = ({ task, productJob, matchedDefinition, index }) => {
  const { currentUser } = React.useContext(AuthContext);
  const { upsertTask } = useContextQueries();
  const currentTheme = useCurrentTheme();
  const leftBarOpen = useLeftBarOpenStore((state: any) => state.leftBarOpen);
  const taskForm = useTaskForm();
  const taskStatus = useWatch({ control: taskForm.control, name: "status" });

  useEffect(() => {
    if (task?.task_id) {
      taskForm.reset(task as TaskFormData);
    }
  }, [task, task?.task_id, taskForm]);

  if (!productJob || !matchedDefinition) return null;
  const onFormSubmitButton = async (data: TaskFormData) => {
    const submitValue = {
      ...data,
      task_id: task.task_id,
      job_id: productJob.id,
      scheduled_start_date: dateToString(data.scheduled_start_date ?? null),
    } as Task;
    await upsertTask(submitValue);
  };

  const callSubmitForm = async () => {
    await taskForm.handleSubmit(onFormSubmitButton)();
  };

  const completed = task.status === "complete";
  if (!currentUser) return null;

  return (
    <form
      onSubmit={taskForm.handleSubmit(onFormSubmitButton)}
      className={`${
        taskStatus === "cancelled" && "opacity-[0.5]"
      } rounded-[calc(6px+0.2vw)] relative`}
      style={{
        ...getInnerCardStyle(currentUser.theme, currentTheme),
        transform: "translateZ(0)",
      }}
    >
      <div className="w-[100%] h-[100%] z-[300] flex items-center gap-[3%] pl-[2%] pr-[calc(2px+0.3vw)] min-[1400px]:pr-[calc(5px+0.8vw)] py-[4px] min-[800px]:py-[0.9%]">
        <div
          className="min-w-[7.3%] aspect-[1/1] rounded-[calc(6px+0.1vw)] flex items-center justify-center"
          style={{
            background: completed
              ? "rgba(115,255,115,0.29)"
              : "rgba(6,182,212,0.18)",
          }}
        >
          {completed ? <Check size={14} /> : <Activity size={14} />}
        </div>
        <div className="flex-1 min-w-0 items-center flex flex-row-reverse justify-between gap-[2%]">
          <div
            className={`flex w-auto gap-[10px] ${
              leftBarOpen
                ? "flex-col-reverse min-[1400px]:flex-row min-[1400px]:items-center"
                : "flex-col-reverse min-[1090px]:flex-row min-[1090px]:items-center"
            }`}
          >
            <TaskStatusBadge
              form={taskForm}
              matchedDefinition={matchedDefinition}
              cancelTimer={() => {}}
              callSubmitForm={callSubmitForm}
              oneSize={false}
            />
          </div>
          <div className="flex-1 min-w-0 max-w-[100%] text-[calc(10px+0.15vw)] leading-[calc(11px+0.16vw)] font-[500] outline-none truncate">
            {task.task && task.task.length > 0
              ? task.task
              : `Task ${index + 1}`}
          </div>
        </div>
      </div>
    </form>
  );
};

// ---------- JobCard (main) ----------
const CustomerProductFrame = ({
  product,
  index,
}: {
  product: Product;
  index: number;
}) => {
  const { currentUser } = useContext(AuthContext);
  const currentTheme = useCurrentTheme();
  const { setCurrentProductData } = useCurrentDataStore();
  const {
    tasks,
    upsertJob,
    customers,
    mediaLinks,
    jobs,
    jobDefinitions,
    media,
  } = useContextQueries();
  const { screenClick } = useRouting();
  const { screen } = useUiStore();

  const jobForm = useJobForm();
  const status = useWatch({ control: jobForm.control, name: "status" });

  const handleClick = async () => {
    await screenClick(
      "edit-customer-product",
      `/products/${product.serial_number}`
    );
    setCurrentProductData(product);
  };

  const productCustomer = useMemo(() => {
    if (!product || !product.customer_id) return null;
    return customers.find(
      (customer: Customer) => customer.id === product.customer_id
    );
  }, [customers, product]);

  const mediaFound = useMemo(() => {
    const mediaLinksFound = mediaLinks.filter(
      (m: MediaLink) =>
        m.entity_type === "product" && m.entity_id === product.id
    );
    const firstImage = mediaLinksFound.length > 0 ? mediaLinksFound[0] : null;
    if (!firstImage) return null;
    return media.find((item: Media) => item.id === firstImage.media_id);
  }, [product, mediaLinks, media]);

  const productJob = useMemo(() => {
    const filteredJobs = jobs.filter(
      (job: Job) => job.product_id === product.id
    );
    if (filteredJobs.length > 0) {
      return filteredJobs[0];
    }
    return null;
  }, [jobs, product.id]);

  const matchedDefinition = useMemo(() => {
    if (!productJob) return null;
    return jobDefinitions.find(
      (definition: JobDefinition) =>
        productJob.job_definition_id === definition.id
    );
  }, [productJob, jobDefinitions]);

  const leftBarOpen = useLeftBarOpenStore((state: any) => state.leftBarOpen);

  useEffect(() => {
    if (productJob?.job_id) {
      jobForm.reset(productJob as JobFormData);
    }
  }, [productJob?.job_id, jobForm, productJob]);

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
  }, [tasks, productJob]);

  const onFormSubmitButton = async (data: JobFormData) => {
    if (!matchedDefinition || !productJob) return null;
    const safeValuation = (() => {
      if (!data.valuation) return 0;
      const num = parseFloat(data.valuation);
      return isNaN(num) ? 0 : num;
    })();

    const matchedCustomer =
      product && product.customer_id
        ? customers.find(
            (customer: Customer) => customer.id === product.customer_id
          )
        : null;

    const submitValue = {
      ...data,
      scheduled_start_date: dateToString(data.scheduled_start_date ?? null),
      completed_date: dateToString(data.completed_date ?? null),
      valuation: safeValuation,
      job_id: productJob.job_id ? productJob.job_id : null,
      job_definition_id: matchedDefinition.id,
      product_id: product && product.id ? product.id : null,
      customer_id: matchedCustomer ? matchedCustomer.id : null,
    } as Job;
    await upsertJob(submitValue);
  };

  const productJobs = useMemo(() => {
    return jobs.filter((job: Job) => job.product_id === product.id);
  }, [jobs, product.id]);

  if (!currentUser) return null;

  return (
    <div
      onClick={handleClick}
      className={`select-none ${
        screen !== "customers" && "min-h-[100%]"
      } group cursor-pointer rounded-[15px] overflow-hidden relative w-[100%] flex flex-col`}
      style={getCardStyle(currentUser.theme, currentTheme)}
    >
      <form
        onSubmit={jobForm.handleSubmit(onFormSubmitButton)}
        className="w-[100%] select-none pt-[20px] pb-[5px] px-[20px] min-[800px]:pt-[4.7%] min-[800px]:px-[4.7%] min-[800px]:pb-[2px] flex flex-col min-[670px]:flex-row gap-[15px]"
      >
        <div className="h-[100%] min-[510px]:w-[100%] min-[800px]:w-[calc(60px+10vw)] aspect-[1/1]">
          <div className="w-[100%] h-[100%] rounded-[10px] overflow-hidden">
            {!mediaFound ? (
              <NoProductImage />
            ) : (
              <RenderedImage media={mediaFound} rounded={true} />
            )}
          </div>
        </div>
        <div className="flex flex-col gap-[calc(3px+0.2vw)] w-[100%] h-[100%]">
          {/* <div className="w-[100%] h-[100%] gap-[2.5px] flex flex-col ml-[2.5px]">
            <div
              className="font-[600] text-[18.5px] leading-[25px]"
              style={{ color: t.text_1 }}
            >
              {product.make ? product.make : "Make"}
            </div>
            <div
              className="font-[300] text-[16px] leading-[22px]"
              style={{ color: t.text_3 }}
            >
              {product.model ? product.model : "Make"}
            </div>
          </div> */}
          <div className="w-[100%] flex flex-col gap-[8px] min-[800px]:gap-[calc(3px+0.2vw)]">
            <div className="font-[600] text-[calc(12px+0.3vw)] leading-[calc(15px+0.3vw)]">
              {product.name}
            </div>

            <CustomerTag
              productCustomer={productCustomer ?? null}
              oneSize={false}
              product={product}
            />
          </div>
          <div
            className={`mt-[8px] min-[800px]:mt-[4px] flex flex-col min-[750px]:flex-row min-[870px]:flex-col min-[990px]:flex-row ${
              leftBarOpen ? "min-[1024px]:flex-col min-[1220px]:flex-row" : ""
            } items-start justify-between w-full`}
          >
            {matchedDefinition && (
              <div className="mt-[-2px] flex items-start gap-[4%] w-[100%]">
                <div
                  className="hidden min-[870px]:flex min-[1024px]:hidden min-[1200px]:flex mt-[2px] p-[4px] rounded-[7px] shadow-sm"
                  style={{
                    backgroundColor: currentTheme.background_3,
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 35,
                    minHeight: 35,
                  }}
                >
                  <FaWrench
                    size={14}
                    className="opacity-[0.65]"
                    style={{ color: currentTheme.text_1 }}
                  />
                </div>

                <div className="flex flex-col max-[800px]:items-start gap-[calc(5px+0.3vw)] min-[800px]:gap-[calc(3px+0.2vw)] w-[100%] items-end">
                  <div className="flex flex-col gap-[calc(5px+0.3vw)] min-[800px]:gap-[calc(3px+0.2vw)] min-[800px]:flex-row min-[800px]:items-center justify-between  w-[100%] mt-[1px]">
                    <div
                      style={{ color: currentTheme.text_1 }}
                      className="text-[14.5px] leading-[16px] font-semibold"
                    >
                      {productJobs.length === 1
                        ? matchedDefinition.type
                        : productJobs.length + " Jobs"}
                    </div>

                    <div className="max-[800px]:w-[100%] max-[800px]:flex max-[800px]:justify-start min-[800px]:flex min-[800px]:flex-1 min-[800px]:justify-end">
                      <PriorityBadge
                        form={jobForm}
                        cancelTimer={cancelTimer}
                        callSubmitForm={callSubmitForm}
                        oneSize={false}
                      />
                    </div>
                  </div>

                  <StatusBadge
                    form={jobForm}
                    matchedDefinition={matchedDefinition}
                    cancelTimer={cancelTimer}
                    callSubmitForm={callSubmitForm}
                    oneSize={false}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
      <div className="flex-1 px-[13px] pb-[13px] min-[800px]:px-[4%] min-[800px]:pb-[4%] mt-[2%]">
        {matchedDefinition && (
          <div
            className={`${status === "cancelled" && "opacity-[0.5]"} w-[100%]`}
          >
            {/* <div className="w-[100%] h-auto mt-[8px] gap-[14px] flex flex-col">
            <div className="flex flex-col gap-[12px]">
              <div
                className="rounded-xl px-[15px] pt-[11px] pb-[10px] w-[100%]"
                style={getInnerCardStyle(theme, t)}
              >
                <div className="mt-[14px] flex flex-row gap-[13px] items-start">
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
                              employee.first_name ===
                              matchingEmployee.first_name
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
                                  backgroundColor: t.background_4,
                                }}
                                onClick={async () => {
                                  if (assignment.id) {
                                    await deleteEmployeeAssignment(
                                      assignment.id
                                    );
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

                    {employeeAssignments.filter(
                      (assignment: EmployeeAssignment) =>
                        assignment.job_id === productJob.job_id
                    ).length > 0 && (
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
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div> */}

            {jobTasks.length > 0 && (
              <div className="flex flex-col gap-[6px] min-[800px:gap-[calc(3px+0.3vw)]">
                {jobTasks.slice(0, 3).map((task_item: Task, index: number) => (
                  <MiniTaskCard
                    key={index}
                    index={index}
                    task={task_item}
                    matchedDefinition={matchedDefinition}
                    productJob={productJob}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerProductFrame;
