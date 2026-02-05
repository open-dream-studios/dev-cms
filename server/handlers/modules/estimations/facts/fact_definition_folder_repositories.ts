// server/handlers/modules/estimations/fact_definition_folder_repositories.ts
import { db } from "../../../../connection/connect.js";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { ulid } from "ulid";
import {
  getNextOrdinal,
  reindexOrdinals,
  deleteAndReindex,
  reorderOrdinals,
} from "../../../../lib/ordinals.js";

export const getFactFoldersFunction = async (project_idx: number, process_id: number) => {
  const q = `
    SELECT *
    FROM estimation_fact_definitions_folder
    WHERE project_idx = ?
    AND process_id = ?
    ORDER BY ordinal ASC
  `;
  const [rows] = await db.promise().query<RowDataPacket[]>(q, [project_idx, process_id]);
  return rows;
};

export const upsertFactFoldersFunction = async (
  connection: PoolConnection,
  project_idx: number,
  folders: any[]
) => {
  let nextOrdinal = await getNextOrdinal(
    connection,
    "estimation_fact_definitions_folder",
    {
      project_idx,
      parent_folder_id: folders[0]?.parent_folder_id ?? null,
    }
  );

  const values: any[] = [];
  const folderIds: string[] = [];

  for (const f of folders) {
    const finalFolderId = f.folder_id?.trim() || `FACTFOLDER-${ulid()}`;
    const finalOrdinal =
      f.ordinal === null || f.ordinal === undefined ? nextOrdinal++ : f.ordinal;

    values.push(
      finalFolderId,
      project_idx,
      f.parent_folder_id ?? null,
      f.process_id,  
      f.name ?? "",
      finalOrdinal
    );

    folderIds.push(finalFolderId);
    f.folder_id = finalFolderId;
    f.ordinal = finalOrdinal;
  }

  const placeholders = folders.map(() => `(?, ?, ?, ?, ?, ?)`).join(", ");
  const q = `
    INSERT INTO estimation_fact_definitions_folder (
      folder_id, project_idx, parent_folder_id, process_id, name, ordinal
    )
    VALUES ${placeholders}
    ON DUPLICATE KEY UPDATE
      parent_folder_id = VALUES(parent_folder_id),
      process_id = VALUES(process_id),
      name = VALUES(name),
      ordinal = VALUES(ordinal),
      updated_at = NOW()
  `;

  await connection.query(q, values);

  const parentIds = Array.from(
    new Set(folders.map((f) => f.parent_folder_id ?? null))
  );

  for (const parentId of parentIds) {
    await reindexOrdinals(connection, "estimation_fact_definitions_folder", {
      project_idx,
      parent_folder_id: parentId,
    });
  }

  return { success: true, folderIds };
};

export const deleteFactFolderFunction = async (
  connection: PoolConnection,
  project_idx: number,
  folder_id: string
) => {
  return await deleteAndReindex(
    connection,
    "estimation_fact_definitions_folder",
    "folder_id",
    folder_id,
    ["project_idx", "parent_folder_id"]
  );
};

export const reorderFactFoldersFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: any
) => {
  const { parent_folder_id, process_id, orderedIds } = reqBody;

  const layer = {
    project_idx,
    process_id,
    parent_folder_id: parent_folder_id ?? null,
  };

  return await reorderOrdinals(
    connection,
    "estimation_fact_definitions_folder",
    layer,
    orderedIds,
    "folder_id"
  );
};
