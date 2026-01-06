// project/src/modules/CustomersModule/CustomerManager.tsx
import { useEffect } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { DashboardLayout2 } from "@/components/Dashboard/presets/DashboardPreset2";
import { useContextQueries } from "@/contexts/queryContext/queryContext";
import CustomerInteractionTimeline from "./CustomerInteractions";
import MessagesApp from "../MessagesModule/MessagesApp";
import {
  ActionDefinitionInput,
  ActionInput,
  LeadInput,
} from "@open-dream/shared";
import { useCurrentDataStore } from "@/store/currentDataStore";
import { useScheduleRequests } from "@/contexts/queryContext/queries/public/scheduleRequests";
import GoogleCalendarDisplay from "../GoogleModule/GoogleCalendarModule/GoogleCalendarDisplay";

export default function CustomerManager() {
  const {
    projectCalls,
    leads,
    upsertLead,
    deleteLead,
    actions,
    upsertAction,
    deleteAction,
    actionDefinitions,
    upsertActionDefinition,
    deleteActionDefinition,
    customerData,
    scheduleRequests, 
    upsertScheduleRequest
  } = useContextQueries();
  const { currentProjectId } = useCurrentDataStore();

  const { setLayout, registerModules, updateSection, updateShape } =
    useDashboardStore();

  useEffect(() => {
    registerModules({
      layout2_t: null,
      layout2_m1: null,
      layout2_m2: null,
      layout2_m3: null,
      layout2_b: null,
    });
    setLayout(DashboardLayout2);
    updateSection("top", { fixedHeight: 46 });
    updateShape("top-shape", { bg: true });
  }, [registerModules, setLayout, updateSection, updateShape]);
  // return <Dashboard minHeight={800} maxHeight={900} gap={0} />;

  // useEffect(() => {
  //   console.log(leads);
  // }, [leads]);

  // useEffect(() => {
  //   console.log(actions);
  // }, [actions]);

  // useEffect(() => {
  //   console.log(actionDefinitions);
  // }, [actionDefinitions]);

  const handleLeadClick = async () => {
    // await upsertLead({
    //   lead_id: null,
    //   project_idx: currentProjectId,
    //   customer_id: "C-3460280222",
    //   lead_type: "product",
    //   product_id: "P-1586806747",
    //   job_definition_id: null,
    //   status: "new",
    //   notes: null,
    //   source: null,
    // } as LeadInput);
    // await deleteLead("LEAD-01KE15V5VHN3RM4CZC0909SR5V");

    // await upsertActionDefinition({
    //   action_definition_id: "ACTDEF-01KE2MFNP4BDWPZKT9SQC7K29Y",
    //   project_idx: currentProjectId,
    //   tag: "text-action",
    //   title: "Text",
    //   description: "Text",
    // } as ActionDefinitionInput);

    // await deleteActionDefinition("ACTDEF-01KE2MFNP4BDWPZKT9SQC7K29Y")

    // await upsertAction({
    //   action_id: "TASK-01KE2MNN7TFQYP2X3J6ESKH1TV",
    //   project_idx: currentProjectId,
    //   job_id: null,
    //   customer_id: "C-3460280222",
    //   action_definition_id: "ACTDEF-01KE2MFNP4BDWPZKT9SQC7K29Y",
    //   status: "open",
    //   priority: "low",
    //   scheduled_start_date: null,
    //   completed_date: null,
    //   title: "Jamie",
    //   description: null,
    // } as ActionInput);

    // await deleteAction("TASK-01KE2MNN7TFQYP2X3J6ESKH1TV")
    console.log(customerData)
  };

  return (
    <div className="w-[100%] h-[100%]">
      {/* <div
        className="w-[20px] h-[20px] bg-red-400 cursor-pointer"
        onClick={handleLeadClick}
      ></div> */}
      <div className="px-[14px] py-[12px] "><GoogleCalendarDisplay /></div>
      {/* <MessagesApp /> */}
    </div>
  );
  // return <CustomerInteractionTimeline />;
}
