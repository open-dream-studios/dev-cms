// server/modules/jobs/jobs_repositories.js
import { db } from "../../connection/connect.js";
import crypto from "crypto";
import { storeStringAsUTC } from "../../functions/data.js";

// ---------- JOB FUNCTIONS ----------
export const getJobsFunction = async (project_idx) => {
  const q = `
    SELECT * FROM jobs
    WHERE project_idx = ?
    ORDER BY created_at DESC
  `;
  try {
    const [rows] = await db.promise().query(q, [project_idx]);
    return rows;
  } catch (err) {
    console.error("❌ Function Error -> getJobsFunction: ", err);
    return [];
  }
};

export const upsertJobFunction = async (project_idx, reqBody) => {
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

  try {
    const finalJobId =
      job_id && job_id.trim() !== ""
        ? job_id
        : "J-" +
          Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join(
            ""
          );

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

    const [result] = await db.promise().query(query, values);

    return {
      success: true,
      job_id: finalJobId,
    };
  } catch (err) {
    console.error("❌ Function Error -> upsertJobFunction: ", err);
    return {
      success: false,
      job_id: null,
    };
  }
};

export const deleteJobFunction = async (project_idx, job_id) => {
  const q = `DELETE FROM jobs WHERE job_id = ? AND project_idx = ?`;
  try {
    await db.promise().query(q, [job_id, project_idx]);
    return true;
  } catch (err) {
    console.error("❌ Function Error -> deleteJobFunction: ", err);
    return false;
  }
};

// ---------- JOB DEFINITION FUNCTIONS ----------
export const getJobDefinitionsFunction = async (project_idx) => {
  const q = `
    SELECT * FROM job_definitions
    WHERE project_idx = ?
    ORDER BY created_at ASC
  `;
  try {
    const [rows] = await db.promise().query(q, [project_idx]);
    return rows;
  } catch (err) {
    console.error("❌ Function Error -> getJobDefinitionsFunction: ", err);
    return [];
  }
};

export const upsertJobDefinitionFunction = async (project_idx, reqBody) => {
  const { job_definition_id, type, description } = reqBody;

  try {
    const finalDefinitionId =
      job_definition_id && job_definition_id.trim() !== ""
        ? job_definition_id
        : crypto.randomBytes(8).toString("hex");

    const query = `
      INSERT INTO job_definitions (job_definition_id, project_idx, type, description)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        type = VALUES(type),
        description = VALUES(description),
        updated_at = NOW()
    `;

    const values = [finalDefinitionId, project_idx, type, description || null];

    const [result] = await db.promise().query(query, values);

    return {
      success: true,
      definition_id: finalDefinitionId,
    };
  } catch (err) {
    console.error("❌ Function Error -> upsertJobFunction: ", err);
    return {
      success: false,
      definition_id: null,
    };
  }
};

export const deleteJobDefinitionFunction = async (
  project_idx,
  job_definition_id
) => {
  const q = `DELETE FROM job_definitions WHERE job_definition_id = ? AND project_idx = ?`;
  try {
    await db.promise().query(q, [job_definition_id, project_idx]);
    return true;
  } catch (err) {
    console.error("❌ Function Error -> deleteJobDefinitionFunction: ", err);
    return false;
  }
};
