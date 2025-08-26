// util/permissions.js
import { db } from "../connection/connect.js";

export const checkProjectPermission = (requiredLevel) => {
  return (req, res, next) => {
    const project_idx = req.query.project_idx || req.body.project_idx;
    if (!project_idx) {
      return res.status(400).json("Missing project_idx");
    }

    const userEmail = req.user.email;

    const q = `
      SELECT role FROM project_users 
      WHERE project_idx = ? AND email = ?
    `;
    db.query(q, [project_idx, userEmail], (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length === 0) {
        return res.status(403).json("You are not part of this project!");
      }

      const role = results[0].role;
      const roleLevels = { viewer: 1, editor: 2, owner: 3, admin: 4 };
      const userLevel = roleLevels[role] || 0;

      if (userLevel < requiredLevel) {
        return res.status(403).json("Insufficient permissions");
      }

      req.user = { ...req.user, role, project_idx, userLevel };
      next();
    });
  };
};
