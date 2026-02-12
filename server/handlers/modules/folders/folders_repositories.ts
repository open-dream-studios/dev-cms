// server/handlers/modules/folders/folder_repositories.ts
import { db } from "../../../connection/connect.js";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { ulid } from "ulid";
import {
  getNextOrdinal,
  reindexOrdinals,
  deleteAndReindex,
  reorderOrdinals,
} from "../../../lib/ordinals.js";
import type { FolderInput, FolderScope } from "@open-dream/shared";

export const getFoldersRepo = async (
  project_idx: number,
  scope: FolderScope,
  process_id: number | null
) => {
  const q = `
    SELECT *
    FROM project_folders
    WHERE project_idx = ?
      AND scope = ?
      AND (${process_id === null ? "process_id IS NULL" : "process_id = ?"})
    ORDER BY ordinal ASC
  `;

  const params =
    process_id === null
      ? [project_idx, scope]
      : [project_idx, scope, process_id];

  const [rows] = await db.promise().query<RowDataPacket[]>(q, params);
  return rows;
};

export const upsertFoldersRepo = async (
  connection: PoolConnection,
  project_idx: number,
  folders: FolderInput[]
) => {
  const [first] = folders as FolderInput[];
  const nextOrdinal = await getNextOrdinal(connection, "project_folders", {
    project_idx,
    scope: first.scope,
    process_id: first.process_id ?? null,
    parent_folder_id: first.parent_folder_id ?? null,
  });

  let ordinal = nextOrdinal;
  const values: any[] = [];
  const folderIds: string[] = [];

  for (const f of folders) {
    const folder_id = f.folder_id?.trim() || `FOLDER-${ulid()}`;

    const o =
      f.ordinal === undefined || f.ordinal === null ? ordinal++ : f.ordinal;

    values.push(
      folder_id,
      project_idx,
      f.process_id ?? null,
      f.scope,
      f.parent_folder_id ?? null,
      f.name,
      o
    );

    folderIds.push(folder_id);
  }

  const placeholders = folders.map(() => `(?, ?, ?, ?, ?, ?, ?)`).join(", ");

  const q = `
    INSERT INTO project_folders (
      folder_id,
      project_idx,
      process_id,
      scope,
      parent_folder_id,
      name,
      ordinal
    )
    VALUES ${placeholders}
    ON DUPLICATE KEY UPDATE
      parent_folder_id = VALUES(parent_folder_id),
      name = VALUES(name),
      ordinal = VALUES(ordinal),
      updated_at = NOW()
  `;

  await connection.query(q, values);

  await reindexOrdinals(connection, "project_folders", {
    project_idx,
    scope: first.scope,
    process_id: first.process_id ?? null,
    parent_folder_id: first.parent_folder_id ?? null,
  });

  return { success: true, folderIds };
};

export const deleteFolderRepo = async (
  connection: PoolConnection,
  project_idx: number,
  folder_id: string
) => {
  // lock parent
  const [parentRows] = await connection.query<RowDataPacket[]>(
    `SELECT * 
     FROM project_folders 
     WHERE folder_id = ? 
     FOR UPDATE`,
    [folder_id]
  );

  if (!parentRows.length) {
    throw new Error("Folder not found");
  }

  const parent = parentRows[0];

  // lock children
  const [children] = await connection.query<RowDataPacket[]>(
    `SELECT * 
     FROM project_folders
     WHERE parent_folder_id = ?
     FOR UPDATE`,
    [parent.id]
  );

  // get next ordinal for NULL layer
  let nextOrdinal = await getNextOrdinal(connection, "project_folders", {
    project_idx,
    scope: parent.scope,
    process_id: parent.process_id ?? null,
    parent_folder_id: null,
  });

  // move children to NULL parent with new ordinals
  for (const child of children) {
    await connection.query(
      `UPDATE project_folders
       SET parent_folder_id = NULL,
           ordinal = ?
       WHERE id = ?`,
      [nextOrdinal++, child.id]
    );
  }

  // delete parent
  await connection.query(
    `DELETE FROM project_folders
     WHERE id = ?`,
    [parent.id]
  );

  // reindex original layer
  await reindexOrdinals(connection, "project_folders", {
    project_idx,
    scope: parent.scope,
    process_id: parent.process_id ?? null,
    parent_folder_id: parent.parent_folder_id ?? null,
  });

  // reindex NULL layer
  await reindexOrdinals(connection, "project_folders", {
    project_idx,
    scope: parent.scope,
    process_id: parent.process_id ?? null,
    parent_folder_id: null,
  });

  return { success: true };
};

export const moveFolderRepo = async (
  connection: PoolConnection,
  project_idx: number,
  folder: FolderInput
) => {
  const {
    folder_id,
    scope,
    process_id = null,
    parent_folder_id = null,
    ordinal,
  } = folder;

  if (!folder_id || !scope) {
    throw new Error("Invalid move payload");
  }

  // Lock moving folder
  const [rows] = await connection.query<RowDataPacket[]>(
    `
    SELECT *
    FROM project_folders
    WHERE folder_id = ?
      AND project_idx = ?
    FOR UPDATE
    `,
    [folder_id, project_idx]
  );

  if (!rows.length) throw new Error("Folder not found");

  const current = rows[0];

  const oldLayer = {
    project_idx,
    scope: current.scope,
    process_id: current.process_id ?? null,
    parent_folder_id: current.parent_folder_id ?? null,
  };

  const newLayer = {
    project_idx,
    scope,
    process_id: process_id ?? null,
    parent_folder_id: parent_folder_id ?? null,
  };

  // --------------------------------------------
  // CASE 1 — append to parent (ordinal === null)
  // --------------------------------------------
  if (ordinal === null || ordinal === undefined) {
    const nextOrdinal = await getNextOrdinal(
      connection,
      "project_folders",
      newLayer
    );

    await connection.query(
      `
      UPDATE project_folders
      SET parent_folder_id = ?,
          ordinal = ?
      WHERE folder_id = ?
        AND project_idx = ?
      `,
      [parent_folder_id ?? null, nextOrdinal, folder_id, project_idx]
    );

    // reindex old layer
    await reindexOrdinals(connection, "project_folders", oldLayer);

    // reindex new layer
    await reindexOrdinals(connection, "project_folders", newLayer);

    return { success: true };
  }

  // --------------------------------------------
  // CASE 2 — insert at specific ordinal
  // --------------------------------------------
  const targetOrdinal = ordinal;
  
  const movingWithinSameLayer =
    current.scope === scope &&
    (current.process_id ?? null) === (process_id ?? null) &&
    (current.parent_folder_id ?? null) === (parent_folder_id ?? null);

  if (movingWithinSameLayer) {
    const oldOrdinal = current.ordinal;

    if (oldOrdinal < targetOrdinal) {
      // moving DOWN
      await connection.query(
        `
      UPDATE project_folders
      SET ordinal = ordinal - 1
      WHERE project_idx = ?
        AND scope = ?
        AND process_id <=> ?
        AND parent_folder_id <=> ?
        AND ordinal > ?
        AND ordinal <= ?
      `,
        [
          project_idx,
          scope,
          process_id ?? null,
          parent_folder_id ?? null,
          oldOrdinal,
          targetOrdinal,
        ]
      );
    } else if (oldOrdinal > targetOrdinal) {
      // moving UP
      await connection.query(
        `
      UPDATE project_folders
      SET ordinal = ordinal + 1
      WHERE project_idx = ?
        AND scope = ?
        AND process_id <=> ?
        AND parent_folder_id <=> ?
        AND ordinal >= ?
        AND ordinal < ?
      `,
        [
          project_idx,
          scope,
          process_id ?? null,
          parent_folder_id ?? null,
          targetOrdinal,
          oldOrdinal,
        ]
      );
    }

    await connection.query(
      `
    UPDATE project_folders
    SET ordinal = ?
    WHERE folder_id = ?
      AND project_idx = ?
    `,
      [targetOrdinal, folder_id, project_idx]
    );

    return { success: true };
  }

  // ELSE -> move to different parent layer
  if (!movingWithinSameLayer) {
    // lock new siblings
    await connection.query(
      `
    SELECT id
    FROM project_folders
    WHERE project_idx = ?
      AND scope = ?
      AND process_id <=> ?
      AND parent_folder_id <=> ?
    FOR UPDATE
    `,
      [project_idx, scope, process_id ?? null, parent_folder_id ?? null]
    );

    // shift new layer
    await connection.query(
      `
    UPDATE project_folders
    SET ordinal = ordinal + 1
    WHERE project_idx = ?
      AND scope = ?
      AND process_id <=> ?
      AND parent_folder_id <=> ?
      AND ordinal >= ?
    `,
      [
        project_idx,
        scope,
        process_id ?? null,
        parent_folder_id ?? null,
        targetOrdinal,
      ]
    );

    // move folder
    await connection.query(
      `
    UPDATE project_folders
    SET parent_folder_id = ?,
        ordinal = ?
    WHERE folder_id = ?
      AND project_idx = ?
    `,
      [parent_folder_id ?? null, targetOrdinal, folder_id, project_idx]
    );

    // reindex old layer
    await reindexOrdinals(connection, "project_folders", oldLayer);

    // reindex new layer
    await reindexOrdinals(connection, "project_folders", newLayer);

    return { success: true };
  }
};
