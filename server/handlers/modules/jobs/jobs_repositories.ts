// server/handlers/modules/jobs/jobs_repositories.ts
import { db } from "../../../connection/connect.js";
import crypto from "crypto";
import { storeStringAsUTC } from "../../../functions/data.js";
import { Job, JobDefinition } from "@open-dream/shared";
import type { RowDataPacket, PoolConnection } from "mysql2/promise";
import { ulid } from "ulid";

// ---------- JOB FUNCTIONS ----------
export const getJobsFunction = async (project_idx: number): Promise<Job[]> => {
  const q = `
    SELECT * FROM jobs
    WHERE project_idx = ?
    ORDER BY created_at DESC
  `;
  const [rows] = await db
    .promise()
    .query<(Job & RowDataPacket)[]>(q, [project_idx]);
  return rows;
};

export const upsertJobFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: any
) => {
  const {
    job_id,
    job_definition_id,
    product_id,
    customer_id,
    valuation,
    status,
    priority,
    scheduled_start_date,
    completed_date,
    notes,
  } = reqBody;

  const finalJobId = job_id?.trim() || `JOB-${ulid()}`;

  const query = `
      INSERT INTO jobs (
        job_id, project_idx, job_definition_id, product_id, customer_id,
        valuation, status, priority, scheduled_start_date, completed_date, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        job_definition_id = VALUES(job_definition_id),
        product_id = VALUES(product_id),
        customer_id = VALUES(customer_id),
        valuation = VALUES(valuation),
        status = VALUES(status),
        priority = VALUES(priority),
        scheduled_start_date = VALUES(scheduled_start_date),
        completed_date = VALUES(completed_date),
        notes = VALUES(notes),
        updated_at = NOW()
    `;

  const projectTimezone = "America/New_York";

  const values = [
    finalJobId,
    project_idx,
    job_definition_id,
    product_id,
    customer_id,
    valuation,
    status || "work_required",
    priority || "medium",
    storeStringAsUTC(scheduled_start_date, projectTimezone),
    storeStringAsUTC(completed_date, projectTimezone),
    notes || null,
  ];

  const [result] = await connection.query(query, values);

  return {
    success: true,
    job_id: finalJobId,
  };
};

export const deleteJobFunction = async (
  connection: PoolConnection,
  project_idx: number,
  job_id: string
) => {
  const q = `DELETE FROM jobs WHERE job_id = ? AND project_idx = ?`;
  await connection.query(q, [job_id, project_idx]);
  return { success: true };
};

// ---------- JOB DEFINITION FUNCTIONS ----------
export const getJobDefinitionsFunction = async (
  project_idx: number
): Promise<JobDefinition[]> => {
  const q = `
    SELECT * FROM job_definitions
    WHERE project_idx = ?
    ORDER BY created_at ASC
  `;
  const [rows] = await db
    .promise()
    .query<(JobDefinition & RowDataPacket)[]>(q, [project_idx]);
  return rows;
};

export const upsertJobDefinitionFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: any
) => {
  const {
    job_definition_id,
    parent_job_definition_id,
    identifier,
    type,
    description,
  } = reqBody;

  if (!identifier) {
    throw new Error("Action definition requires identifier");
  }

  const [rows] = await connection.query<any[]>(
    `
    SELECT id
    FROM job_definitions
    WHERE project_idx = ?
      AND identifier = ?
    LIMIT 1
    `,
    [project_idx, identifier]
  );

  if (
    rows.length > 0 &&
    (!job_definition_id || job_definition_id === rows[0].job_definition_id)
  ) {
    return {
      success: false,
      message: "Identifier already exists",
    };
  }

  const finalJobDefinitionId = job_definition_id?.trim() || `JOBDEF-${ulid()}`;

  const query = `
      INSERT INTO job_definitions (job_definition_id, parent_job_definition_id, project_idx, identifier, type, description)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        parent_job_definition_id = VALUES(parent_job_definition_id),
        identifier = VALUES(identifier),
        type = VALUES(type),
        description = VALUES(description),
        updated_at = NOW()
    `;

  const values = [
    finalJobDefinitionId,
    parent_job_definition_id,
    project_idx,
    identifier,
    type,
    description || null,
  ];

  const [result] = await connection.query(query, values);

  return {
    success: true,
    definition_id: finalJobDefinitionId,
  };
};

export const deleteJobDefinitionFunction = async (
  connection: PoolConnection,
  project_idx: number,
  job_definition_id: string
) => {
  const q = `DELETE FROM job_definitions WHERE job_definition_id = ? AND project_idx = ?`;
  await connection.query(q, [job_definition_id, project_idx]);
  return { success: true };
};
