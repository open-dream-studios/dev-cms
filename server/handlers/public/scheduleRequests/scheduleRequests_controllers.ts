// server/handlers/public/scheduleRequests/scheduleRequests_controllers.ts
import {
  getScheduleRequestsFunction,
  upsertScheduleRequestFunction,
  deleteScheduleRequestFunction,
} from "./scheduleRequests_repositories.js";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import type { Request, Response } from "express";
import { getProjectFromRequest } from "../../../util/verifyProxy.js";
import { getDecryptedIntegrationsFunction } from "../../../handlers/integrations/integrations_repositories.js";
import { fetchCalendarPage } from "../../../services/google/calendar/calendar.js";
import { getProjectDomainFromWixRequest } from "../../../util/verifyWixRequest.js";
import { getProjectIdByDomain } from "../../../handlers/projects/projects_repositories.js";
import { changeToHTTPSDomain } from "../../../functions/data.js";

// ---------- SCHEDULE REQUEST CONTROLLERS ----------

export const getScheduleRequests = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = await getProjectFromRequest(req, connection);
  const requests = await getScheduleRequestsFunction(project_idx);
  return { success: true, schedule_requests: requests };
};

export const upsertScheduleRequest = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const project_idx = await getProjectFromRequest(req, connection);
  const user_id = req.user?.user_id;
  if (!project_idx || !user_id) throw new Error("Missing required params");

  return await upsertScheduleRequestFunction(
    connection,
    project_idx,
    req.body,
    user_id
  );
};

export const deleteScheduleRequest = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { schedule_request_id } = req.body;
  const project_idx = await getProjectFromRequest(req, connection);

  if (!project_idx || !schedule_request_id)
    throw new Error("Missing required fields");

  return await deleteScheduleRequestFunction(
    connection,
    project_idx,
    schedule_request_id
  );
};

// WIX
export const createScheduleRequest = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const {
    source_type,
    request_type,
    proposed_start,
    proposed_end,
    proposed_location,
    customer,
    metadata,
  } = req.body;

  if (!source_type || !request_type) {
    throw new Error("Missing required fields");
  }

  const projectDomain = getProjectDomainFromWixRequest(req);
  const project_idx = await getProjectIdByDomain(connection, projectDomain);

  if (!project_idx) throw new Error("Missing required fields");

  await upsertScheduleRequestFunction(
    connection,
    project_idx,
    {
      source_type,
      request_type,
      proposed_start,
      proposed_end,
      proposed_location,
      ai_reasoning: JSON.stringify({
        customer,
        metadata,
      }),
    },
    null
  );

  return res.status(200).json({ success: true });
};

export const getScheduleAvailability = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { date } = req.query;

  if (!date || typeof date !== "string") {
    throw new Error("date query param required (YYYY-MM-DD)");
  }

  const projectDomain = getProjectDomainFromWixRequest(req);
  const project_idx = await getProjectIdByDomain(connection, projectDomain);

  console.log(projectDomain, project_idx)
  if (!project_idx) throw new Error("Missing required fields");

  const REQUIRED_KEYS = [
    "GOOGLE_CLIENT_SECRET_OBJECT",
    "GOOGLE_REFRESH_TOKEN_OBJECT",
  ];
  const decryptedKeys = await getDecryptedIntegrationsFunction(
    project_idx,
    REQUIRED_KEYS,
    REQUIRED_KEYS
  );

  if (!decryptedKeys) {
    throw new Error("Required Google keys not found");
  }

  const { GOOGLE_CLIENT_SECRET_OBJECT, GOOGLE_REFRESH_TOKEN_OBJECT } =
    decryptedKeys;

  // Build day window
  const timeMin = new Date(`${date}T00:00:00`).toISOString();
  const timeMax = new Date(`${date}T23:59:59`).toISOString();

  // Fetch events
  const calendarId =
    "715279f46fc8a42c8780b44ae152f224e106d4ba155b1d7734e334c368a3b2ea@group.calendar.google.com";

  if (!GOOGLE_CLIENT_SECRET_OBJECT || !GOOGLE_REFRESH_TOKEN_OBJECT)
    return {
      busy: [],
    };

  const page = await fetchCalendarPage(
    GOOGLE_CLIENT_SECRET_OBJECT,
    GOOGLE_REFRESH_TOKEN_OBJECT,
    {
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      pageSize: 50,
    }
  );

  // Normalize to busy blocks
  const busy = page.events
    .filter((ev: any) => ev.start?.dateTime && ev.end?.dateTime)
    .map((ev: any) => ({
      start: ev.start!.dateTime!,
      end: ev.end!.dateTime!,
    }));

  return {
    busy,
  };
};
