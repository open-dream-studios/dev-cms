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
  return await deleteAndReindex(
    connection,
    "project_folders",
    "folder_id",
    folder_id,
    ["project_idx", "scope", "parent_folder_id"]
  );
};

export const reorderFoldersRepo = async (
  connection: PoolConnection,
  project_idx: number,
  layer: {
    scope: FolderScope;
    process_id: number | null;
    parent_folder_id: number | null;
    orderedIds: string[];
  }
) => {
  return await reorderOrdinals(
    connection,
    "project_folders",
    {
      project_idx,
      scope: layer.scope,
      process_id: layer.process_id,
      parent_folder_id: layer.parent_folder_id,
    },
    layer.orderedIds,
    "folder_id"
  );
};
