// server/controllers/jobs.js
import { db } from "../connection/connect.js";
import crypto from "crypto";
import { storeStringAsUTC } from "../functions/data.js";

// ---------- JOBS ----------
export const getJobs = (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }

  const q = `
    SELECT * FROM jobs
    WHERE project_idx = ?
    ORDER BY created_at DESC
  `;

  db.query(q, [project_idx], (err, rows) => {
    if (err) {
      console.error("❌ Fetch jobs error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.json({ jobs: rows });
  });
};

export const upsertJob = async (req, res) => {
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
  } = req.body;
  const project_idx = req.user?.project_idx;

  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }

  try {
    // Generate job_id if not provided
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

    return res.status(200).json({
      success: true,
      job_id: finalJobId,
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    console.error("❌ Upsert job error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteJob = (req, res) => {
  const { job_id } = req.body;
  const project_idx = req.user?.project_idx;

  if (!project_idx || !job_id) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const q = `DELETE FROM jobs WHERE job_id = ? AND project_idx = ?`;
  db.query(q, [job_id, project_idx], (err) => {
    if (err) {
      console.error("❌ Delete job error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.status(200).json({ message: "Job deleted" });
  });
};

// ---------- JOB DEFINITIONS ----------
export const getAllJobDefinitions = (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }

  const q = `
    SELECT * FROM job_definitions
    WHERE project_idx = ?
    ORDER BY created_at ASC
  `;

  db.query(q, [project_idx], (err, rows) => {
    if (err) {
      console.error("❌ Fetch job definitions error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.json({ jobDefinitions: rows });
  });
};

export const upsertJobDefinition = async (req, res) => {
  const { job_definition_id, type, description } = req.body;
  const project_idx = req.user?.project_idx;

  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }

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

    return res.status(200).json({
      success: true,
      definition_id: finalDefinitionId,
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    console.error("❌ Upsert job definition error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteJobDefinition = (req, res) => {
  const { job_definition_id } = req.body;
  const project_idx = req.user?.project_idx;

  if (!project_idx || !job_definition_id) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const q = `DELETE FROM job_definitions WHERE job_definition_id = ? AND project_idx = ?`;
  db.query(q, [job_definition_id, project_idx], (err) => {
    if (err) {
      console.error("❌ Delete job definition error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.status(200).json({ message: "Job definition deleted" });
  });
};
