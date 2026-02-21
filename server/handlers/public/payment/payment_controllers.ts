// server/handlers/public/payment/payment_controllers.ts
import type { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";
import { getProjectDomainFromWixRequest } from "../../../util/verifyWixRequest.js";
import { getProjectIdByDomain } from "../../../handlers/projects/projects_repositories.js";

// ---------- WIX PAYMENT CONTROLLERS ----------
export const getStripeCheckoutLink = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const {
    customer,
    selectedDay
  } = req.body;

  console.log(req.body, customer, selectedDay)

  // if (!source_type || !request_type) {
  //   throw new Error("Missing required fields");
  // }

  // const projectDomain = getProjectDomainFromWixRequest(req);
  // const project_idx = await getProjectIdByDomain(projectDomain);

  // if (!project_idx) throw new Error("Missing required fields");

  // await upsertScheduleRequestFunction(
  //   connection,
  //   project_idx,
  //   {
  //     source_type,
  //     request_type,
  //     proposed_start,
  //     proposed_end,
  //     proposed_location,
  //     ai_reasoning: null,
  //     event_title,
  //     event_description,
  //     metadata,
  //   },
  //   null
  // );

  return { success: true, url: "https://google.com" };
};