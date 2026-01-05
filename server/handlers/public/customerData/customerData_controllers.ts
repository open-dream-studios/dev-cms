// server/handlers/public/customerData/customerData_controllers.ts
import type { PoolConnection } from "mysql2/promise";
import type { Request, Response } from "express";
import { getCustomerDataFunction } from "./customerData_repositories.js";
import { getProjectFromRequest } from "../../../util/verifyProxy.js";

export const getCustomerData = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = await getProjectFromRequest(req, connection);
  const user_id = req.user?.user_id;
  const user_email = req.user?.email;
  console.log(project_idx, user_id, user_email)
  if (!project_idx || !user_id || !user_email) throw new Error("Missing auth");

  const customerData = await getCustomerDataFunction(
    connection,
    project_idx,
    user_id,
    user_email
  );

  return { success: true, customerData };
};
