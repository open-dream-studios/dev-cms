// server/handlers/modules/estimations/fact_definition_enum_repositories.ts
import { db } from "../../../../connection/connect.js";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { ulid } from "ulid";
import { reorderOrdinals } from "../../../../lib/ordinals.js";

export const getEnumOptionsByFactDefinition = async (
  fact_definition_idx: number
) => {
  const [rows] = await db.promise().query(
    `
    SELECT *
    FROM estimation_fact_enum_options
    WHERE fact_definition_idx = ?
      AND is_archived = 0
    ORDER BY ordinal DESC
    `,
    [fact_definition_idx]
  );
  return rows;
};

export const upsertEnumOption = async (
  connection: PoolConnection,
  fact_definition_idx: number,
  data: {
    option_id?: string;
    label: string;
    value: string;
    ordinal?: number;
  }
) => {
  const optionId = data.option_id ?? `ENUMOPT-${ulid()}`;

  // 1. ensure enum
  const [facts] = await connection.query<RowDataPacket[]>(
    `SELECT fact_type FROM estimation_fact_definitions WHERE id = ?`,
    [fact_definition_idx]
  );

  if (!facts.length || facts[0].fact_type !== "enum") {
    throw new Error("Cannot add enum options to non-enum fact");
  }

  // 2. DUPLICATE CHECK (this is the missing piece)
  const [dupes] = await connection.query<RowDataPacket[]>(
    `
    SELECT 1
    FROM estimation_fact_enum_options
    WHERE fact_definition_idx = ?
      AND value = ?
      AND option_id != ?
    LIMIT 1
    `,
    [fact_definition_idx, data.value.trim(), optionId]
  );

  if (dupes.length) {
    return {
      success: false,
      message: "Duplicate enum option value",
    };
  }

  // 3. UPSERT (safe now)
  await connection.query(
    `
    INSERT INTO estimation_fact_enum_options (
      option_id,
      fact_definition_idx,
      label,
      value,
      ordinal
    )
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      label = VALUES(label),
      value = VALUES(value),
      ordinal = VALUES(ordinal),
      updated_at = NOW()
    `,
    [
      optionId,
      fact_definition_idx,
      data.label.trim(),
      data.value.trim(),
      data.ordinal ?? 0,
    ]
  );

  return { success: true, option_id: optionId };
};

export const deleteEnumOption = async (
  connection: PoolConnection,
  option_id: string
) => {
  await connection.query(
    `
    DELETE FROM estimation_fact_enum_options
    WHERE option_id = ?
    `,
    [option_id]
  );
};

export const reorderEnumOptions = async (
  connection: PoolConnection,
  fact_definition_idx: number,
  orderedOptionIds: string[]
) => {
  return await reorderOrdinals(
    connection,
    "estimation_fact_enum_options",
    { fact_definition_idx },
    orderedOptionIds,
    "option_id"
  );
};
