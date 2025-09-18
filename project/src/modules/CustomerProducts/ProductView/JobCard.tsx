// project/src/modules/Jobs/JobCard.tsx
"use client";
import { useContext, useMemo } from "react";
import { useJobForm } from "@/hooks/useJobForm";
import { JobFormData } from "@/util/schemas/jobSchema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import InputField from "../Forms/InputField";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import { AuthContext } from "@/contexts/authContext";
import { appTheme } from "@/util/appTheme";
import { FaWrench } from "react-icons/fa6";

type JobCardProps = {
  productId: number;
};

const JobCard = ({ productId }: JobCardProps) => {
  const { jobs } = useContextQueries();
  const { currentUser } = useContext(AuthContext);

  if (!currentUser) return;

  const productJobs = useMemo(
    () => jobs.filter((item) => item.product_id === productId),
    [jobs, productId]
  );

  const initialData: Partial<JobFormData> = {
    // job_id: "",
    // product_id: productId,
    // job_definition_id: undefined,
    status: "work_required",
    priority: "medium",
    scheduled_date: undefined,
    completed_date: undefined,
    notes: "",
  };

  const onSubmit = (data: JobFormData) => {
    console.log("Submitting job data:", data);
  };

  // what happens when deleting
  const onDelete = () => {
    console.log("Deleting job for product:", productId);
  };

  const form = useJobForm(initialData);

  return (
    <Card
      style={{
        backgroundColor: appTheme[currentUser.theme].background_2,
        color: appTheme[currentUser.theme].text_1,
        border: `1px solid ${appTheme[currentUser.theme].background_3}`,
      }}
      className="w-[420px] h-[280px] rounded-2xl shadow-md flex flex-col"
    >
      <CardContent className="flex-1 flex flex-col gap-3 overflow-y-auto p-4">
        <div className="flex gap-2">
          <InputField
            label="Status"
            name="status"
            inputType="dropdown"
            register={form.register}
            options={[
              "work_required",
              "waiting_parts",
              "waiting_customer",
              "complete",
              "cancelled",
            ]}
            className="flex-1 text-sm"
          />
          <InputField
            label="Priority"
            name="priority"
            inputType="dropdown"
            register={form.register}
            options={["low", "medium", "high", "urgent"]}
            className="flex-1 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <InputField
            label="Scheduled Date"
            name="scheduled_date"
            inputType="date"
            register={form.register}
            selected={
              form.watch("scheduled_date")
                ? new Date(form.watch("scheduled_date")!)
                : undefined
            }
            onChange={(date) => form.setValue("scheduled_date", date)}
            className="flex-1 text-sm"
          />
          <InputField
            label="Completed Date"
            name="completed_date"
            inputType="date"
            register={form.register}
            selected={
              form.watch("completed_date")
                ? new Date(form.watch("completed_date")!)
                : undefined
            }
            onChange={(date) => form.setValue("completed_date", date)}
            className="flex-1 text-sm"
          />
        </div>

        <InputField
          label="Notes"
          name="notes"
          inputType="textarea"
          register={form.register}
          error={form.formState.errors.notes?.message}
          rows={2}
          className="text-sm"
        />
      </CardContent>

      <div
        className="flex justify-between items-center px-4 py-3 border-t"
        style={{ borderColor: appTheme[currentUser.theme].background_3 }}
      >
        {onDelete && (
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            className="rounded-xl px-4"
            style={{
              backgroundColor: appTheme[currentUser.theme].background_3,
              color: appTheme[currentUser.theme].text_1,
            }}
          >
            Delete
          </Button>
        )}
        <Button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          className="rounded-xl px-6"
          style={{
            backgroundColor: appTheme[currentUser.theme].background_1,
            color: appTheme[currentUser.theme].text_1,
          }}
        >
          Save
        </Button>
      </div>
    </Card>
  );
};

export default JobCard;
