// server/handlers/modules/customers/customers_controller.js
import {
  getCustomersFunction,
  upsertCustomerFunction,
  deleteCustomerFunction,
} from "./customers_repositories.js";

// ---------- CUSTOMER CONTROLLERS ----------
export const getCustomers = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  const customers = await getCustomersFunction(project_idx);
  return { success: true, customers };
};

export const upsertCustomer = async (req, res, connection) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) throw new Error("Missing project_idx");
  return await upsertCustomerFunction(connection, project_idx, req.body);
};

export const deleteCustomer = async (req, res, connection) => {
  const { customer_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !customer_id) throw new Error("Missing required fields");
  return await deleteCustomerFunction(connection, project_idx, customer_id);
};
