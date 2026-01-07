// server/util/verifyProxy.ts
import type { Request, Response, NextFunction } from "express";
import { changeToHTTPSDomain } from "../functions/data.js";
import { PoolConnection, RowDataPacket } from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config()

export function verifyVercelProxy(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const secret = req.headers["x-vercel-proxy-secret"];
  const vercelId = req.headers["x-vercel-id"];

  if (process.env.NODE_ENV !== "production") {
    if (secret === process.env.INTERNAL_PROXY_SECRET) {
      return next();
    }
    return res.status(403).json({ error: "Forbidden (dev)" });
  }

  if (!secret || secret !== process.env.INTERNAL_PROXY_SECRET || !vercelId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

const ALLOWED_HOSTNAMES = new Set(
  process.env.ALLOWED_ORIGINS?.split(",")
    .map((origin) => {
      try {
        return new URL(origin).hostname.toLowerCase();
      } catch {
        return null;
      }
    })
    .filter(Boolean)
);

export const getProjectFromRequest = async (
  req: Request,
  connection: PoolConnection
) => {
  const domain = req.headers["x-project-domain"]?.toString().toLowerCase();
  if (process.env.NODE_ENV !== "production") return 25;
  if (!domain) return null;
  if (
    !ALLOWED_HOSTNAMES.has(domain) &&
    !ALLOWED_HOSTNAMES.has(changeToHTTPSDomain(domain))
  )
    return null;
  const [rows] = await connection.query<RowDataPacket[]>(`
    SELECT id, backend_domain FROM projects
  `);
  const project = rows.find(
    (proj) => changeToHTTPSDomain(proj.backend_domain) === changeToHTTPSDomain(domain)
  );
  return project?.id ?? null;
};
