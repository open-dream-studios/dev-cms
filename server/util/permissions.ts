// server/util/permissions.js
import type { RowDataPacket } from "mysql2";
import { db } from "../connection/connect.js";
import type { Request, Response, NextFunction } from "express";

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
} as const;

export const projectRoles = {
  admin: 9,
  owner: 8,
  manager: 5,
  editor: 3,
  viewer: 1,
} as const;

export const checkProjectPermission = (requiredLevel: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const project_idx = (req.query.project_idx || req.body.project_idx) as
      | number
      | undefined;
    if (!project_idx) {
      res.status(400).json("Missing project_idx");
      return;
    }
    const userEmail = req.user?.email;
    if (!userEmail) {
      res.status(401).json("User not authenticated");
      return;
    }

    const q = `
      SELECT clearance FROM project_users 
      WHERE project_idx = ? AND email = ?
    `;
    const [rows] = await db
      .promise()
      .query<(RowDataPacket & { clearance: number })[]>(q, [
        project_idx,
        userEmail,
      ]);
    if (!rows.length) {
      res.status(403).json("You are not part of this project!");
      return;
    }

    const userClearance = rows[0]!.clearance;
    if (userClearance < requiredLevel) {
      return res.status(403).json("Insufficient permissions");
    }

    req.user = { ...req.user, clearance: userClearance, project_idx };
    next();
  };
};
