// server/util/verifyProxy.ts
import type { Request, Response, NextFunction } from "express";
import { changeToHTTPSDomain } from "../functions/data.js";
import { PoolConnection, RowDataPacket } from "mysql2/promise";

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

  if (
    !secret ||
    secret !== process.env.INTERNAL_PROXY_SECRET ||
    !vercelId
  ) {
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
  const host = req.headers["x-forwarded-host"] ?? req.headers.host;
  console.log("HOST", host)
  if (!host) return null;
  const domain = host.toString().split(":")[0].toLowerCase();
  if (!ALLOWED_HOSTNAMES.has(domain) && !ALLOWED_HOSTNAMES.has(changeToHTTPSDomain(domain))) return null;
  console.log("HAS", domain, ALLOWED_HOSTNAMES, ALLOWED_HOSTNAMES.has(changeToHTTPSDomain(domain)))
  const q = `
    SELECT id, domain
    FROM projects
  `;
  const [rows] = await connection.query<RowDataPacket[]>(q);
  console.log("DOMAIN", domain)
  if (domain === "localhost") return 25;
  const project = rows.find((proj) => changeToHTTPSDomain(proj.domain) === changeToHTTPSDomain(domain));
  console.log(rows, domain);
  console.log(project)
  if (!project?.id) return null;
  return project.id;
};