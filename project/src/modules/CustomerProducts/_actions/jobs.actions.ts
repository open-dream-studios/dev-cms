// project/src/modules/CustomerProducts/_actions/jobs.actions.ts
import { Job, Task } from "@open-dream/shared";
import { JobFormData, TaskFormData } from "@/util/schemas/jobSchema";
import { dateToString } from "@/util/functions/Time";

export async function onJobSubmitFromValues(
  data: JobFormData,
  ctx: {
    upsertJob: (job: Job) => Promise<void>;
    matchedDefinitionId: number;
    productId: number | null;
    customer_id: number | null;
    job_id: string;
  }
) {
  const valuation =
    data.valuation && !isNaN(+data.valuation) ? +data.valuation : 0;

  const submitValue: Job = {
    job_id: ctx.job_id,
    job_definition_id: ctx.matchedDefinitionId,
    product_id: ctx.productId,
    customer_id: ctx.customer_id,
    valuation,
    status: data.status,
    priority: data.priority,
    scheduled_start_date: dateToString(data.scheduled_start_date ?? null),
    completed_date: dateToString(data.completed_date ?? null),
    notes: data.notes ?? null,
  };

  await ctx.upsertJob(submitValue);
}

export async function onTaskSubmitFromValues(
  data: TaskFormData,
  ctx: {
    upsertTask: (task: Task) => Promise<void>;
    job_id: number;
    task_id: string;
  }
) {
  const submitValue: Task = {
    task_id: ctx.task_id,
    job_id: ctx.job_id,
    status: data.status,
    priority: data.priority,
    scheduled_start_date: dateToString(data.scheduled_start_date ?? null),
    task: data.task ?? null,
    description: data.description ?? null,
  };

  await ctx.upsertTask(submitValue);
}
