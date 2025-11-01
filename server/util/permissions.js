// server/util/permissions.js
import { db } from "../connection/connect.js";

export const accessLevels = {
  admin: 9,
  owner: 8,
  protected_access: 7,
  all_access: 6,
  manager: 5,
  specialist: 4,
  editor: 3,
  client: 2,
  viewer: 1,
  external: 0,
};

export const projectRoles = {
  admin: 9,
  owner: 8,
  manager: 5,
  editor: 3,
  viewer: 1,
};

export const checkProjectPermission = (requiredLevel) => {
  return (req, res, next) => {
    const project_idx = req.query.project_idx || req.body.project_idx;
    if (!project_idx) {
      return res.status(400).json("Missing project_idx");
    }

    const userEmail = req.user.email;

    const q = `
      SELECT clearance FROM project_users 
      WHERE project_idx = ? AND email = ?
    `;
    db.query(q, [project_idx, userEmail], (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length === 0) {
        return res.status(403).json("You are not part of this project!");
      }

      const userClearance = results[0].clearance; 
      if (userClearance < requiredLevel) {
        return res.status(403).json("Insufficient permissions");
      }

      req.user = { ...req.user, clearance: userClearance, project_idx };
      next();
    });
  };
};
