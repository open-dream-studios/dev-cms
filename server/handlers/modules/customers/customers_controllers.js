// server/handlers/modules/customers/customers_controller.js
import {
  getCustomersFunction,
  upsertCustomerFunction,
  deleteCustomerFunction,
} from "./customers_repositories.js";

// ---------- CUSTOMER CONTROLLERS ----------
export const getCustomers = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }
  const customers = await getCustomersFunction(project_idx);
  return res.json({ customers });
};

export const upsertCustomer = async (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) {
    return res.status(400).json({ success: false, message: "Missing project_idx" });
  }
  const { customer_id, success } = await upsertCustomerFunction(
    project_idx,
    req.body
  );
  return res.status(success ? 200 : 500).json({ success, customer_id });
};

export const deleteCustomer = async (req, res) => {
  const { customer_id } = req.body;
  const project_idx = req.user?.project_idx;
  if (!project_idx || !customer_id) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }
  const success = await deleteCustomerFunction(project_idx, customer_id);
  return res.status(success ? 200 : 500).json({ success });
};
