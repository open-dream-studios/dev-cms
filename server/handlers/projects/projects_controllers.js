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
  if (!userEmail) {
    return res.status(400).json({ message: "Missing user email" });
  }
  const projects = await getProjectsFunction(userEmail);
  return res.json({ projects });
};

export const upsertProject = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }
  const { project_id, success } = await upsertProjectFunction(req.body);
  return res.status(success ? 200 : 500).json({ success, project_id });
};

export const deleteProject = async (req, res) => {
  const { project_id } = req.body;
  if (!project_id) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }
  const success = await deleteProjectFunction(project_id);
  return res.status(success ? 200 : 500).json({ success });
};

// ---------- PROJECT USER CONTROLLERS ----------
export const getAllUserRoles = async (req, res) => {
  const projectUsers = await getAllUserRolesFunction();
  return res.json({ projectUsers });
};

export const upsertProjectUser = async (req, res) => {
  const { email, project_idx } = req.body;
  if (!email || !project_idx) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }
  const { success } = await upsertProjectUserFunction(
    req.body
  );
  return res.status(success ? 200 : 500).json({ success });
};

export const deleteProjectUser = async (req, res) => {
  const { email, project_idx } = req.body;
  if (!email || !project_idx) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const success = await deleteProjectUserFunction(email, project_idx);
  return res.status(success ? 200 : 500).json({ success });
};
