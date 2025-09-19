// server/controllers/tasks.js
import { db } from "../connection/connect.js";
import crypto from "crypto";

// ---------- TASKS ----------
export const getTasks = (req, res) => {
  const project_idx = req.user?.project_idx;
  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }

  const q = `
    SELECT * FROM tasks
    WHERE project_idx = ?
    ORDER BY created_at DESC
  `;

  db.query(q, [project_idx], (err, rows) => {
    if (err) {
      console.error("❌ Fetch tasks error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.json({ tasks: rows });
  });
};

export const upsertTask = async (req, res) => {
  const {
    task_id,
    job_id,
    status,
    priority,
    scheduled_start_date,
    completed_date,
    description,
    notes,
  } = req.body;
  const project_idx = req.user?.project_idx;

  if (!project_idx) {
    return res.status(400).json({ message: "Missing project_idx" });
  }

  try {
    const finalTaskId =
      task_id && task_id.trim() !== ""
        ? task_id
        : "T-" + Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");

    const query = `
      INSERT INTO tasks (
        task_id, project_idx, job_id, status, priority, 
        scheduled_start_date, completed_date, description, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        job_id = VALUES(job_id),
        status = VALUES(status),
        priority = VALUES(priority),
        scheduled_start_date = VALUES(scheduled_start_date),
        completed_date = VALUES(completed_date),
        description = VALUES(description),
        notes = VALUES(notes),
        updated_at = NOW()
    `;

    const values = [
      finalTaskId,
      project_idx,
      job_id,
      status || "work_required",
      priority || "medium",
      scheduled_start_date || null,
      completed_date || null,
      description || null,
      notes || null,
    ];

    const [result] = await db.promise().query(query, values);

    return res.status(200).json({
      success: true,
      task_id: finalTaskId,
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    console.error("❌ Upsert task error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteTask = (req, res) => {
  const { task_id } = req.body;
  const project_idx = req.user?.project_idx;

  if (!project_idx || !task_id) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const q = `DELETE FROM tasks WHERE task_id = ? AND project_idx = ?`;
  db.query(q, [task_id, project_idx], (err) => {
    if (err) {
      console.error("❌ Delete task error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    return res.status(200).json({ message: "Task deleted" });
  });
};



// ---------- TASK DEFINITIONS ----------
// export const getAllTaskDefinitions = (req, res) => {
//   const project_idx = req.user?.project_idx;
//   if (!project_idx) {
//     return res.status(400).json({ message: "Missing project_idx" });
//   }

//   const q = `
//     SELECT * FROM task_definitions
//     WHERE project_idx = ?
//     ORDER BY created_at ASC
//   `;

//   db.query(q, [project_idx], (err, rows) => {
//     if (err) {
//       console.error("❌ Fetch task definitions error:", err);
//       return res.status(500).json({ message: "Server error" });
//     }
//     return res.json({ taskDefinitions: rows });
//   });
// };

// export const upsertTaskDefinition = async (req, res) => {
//   const { task_definition_id, type } = req.body;
//   const project_idx = req.user?.project_idx;

//   if (!project_idx) {
//     return res.status(400).json({ message: "Missing project_idx" });
//   }

//   try {
//     const finalDefinitionId =
//       task_definition_id && task_definition_id.trim() !== ""
//         ? task_definition_id
//         : crypto.randomBytes(8).toString("hex");

//     const query = `
//       INSERT INTO task_definitions (task_definition_id, project_idx, type)
//       VALUES (?, ?, ?)
//       ON DUPLICATE KEY UPDATE
//         type = VALUES(type),
//         updated_at = NOW()
//     `;

//     const values = [
//       finalDefinitionId,
//       project_idx,
//       type,
//     ];

//     const [result] = await db.promise().query(query, values);

//     return res.status(200).json({
//       success: true,
//       definition_id: finalDefinitionId,
//       affectedRows: result.affectedRows,
//     });
//   } catch (err) {
//     console.error("❌ Upsert task definition error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// export const deleteTaskDefinition = (req, res) => {
//   const { task_definition_id } = req.body;
//   const project_idx = req.user?.project_idx;

//   if (!project_idx || !task_definition_id) {
//     return res.status(400).json({ message: "Missing fields" });
//   }

//   const q = `DELETE FROM task_definitions WHERE task_definition_id = ? AND project_idx = ?`;
//   db.query(q, [task_definition_id, project_idx], (err) => {
//     if (err) {
//       console.error("❌ Delete task definition error:", err);
//       return res.status(500).json({ message: "Server error" });
//     }
//     return res.status(200).json({ message: "Task definition deleted" });
//   });
// };