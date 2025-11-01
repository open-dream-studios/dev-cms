// server/handlers/projects/project_controllers.js
import {
  deleteProjectFunction,
  deleteProjectUserFunction,
  getAllUserRolesFunction,
  getProjectsFunction,
  upsertProjectFunction,
  upsertProjectUserFunction,
} from "./projects_repositories.js";

// ---------- PROJECT CONTROLLERS ----------
export const getProjects = async (req, res) => {
  const userEmail = req.user.email;
  if (!userEmail) throw new Error("Missing user email");
  const projects = await getProjectsFunction(userEmail);
  return { success: true, projects };
};

export const upsertProject = async (req, res, connection) => {
  const { name } = req.body;
  if (!name) throw new Error("Missing required fields");
  return await upsertProjectFunction(connection, req.body);
};

export const deleteProject = async (req, res, connection) => {
  const { project_id } = req.body;
  if (!project_id) throw new Error("Missing required fields");
  return await deleteProjectFunction(connection, project_id);
};

// ---------- PROJECT USER CONTROLLERS ----------
export const getAllUserRoles = async (req, res) => {
  const projectUsers = await getAllUserRolesFunction();
  return { success: true, projectUsers };
};

export const upsertProjectUser = async (req, res, connection) => {
  const { email, project_idx, clearance } = req.body;
  if (!email || !project_idx || !clearance) throw new Error("Missing required fields");
  return await upsertProjectUserFunction(connection, req.body);
};

export const deleteProjectUser = async (req, res, connection) => {
  const { email, project_idx } = req.body;
  if (!email || !project_idx) throw new Error("Missing required fields");
  return await deleteProjectUserFunction(connection, email, project_idx);
};
