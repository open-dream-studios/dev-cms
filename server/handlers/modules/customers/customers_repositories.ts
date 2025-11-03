// server/handlers/modules/customers/customers_repositories.ts
import { db } from "../../../connection/connect.js";
import type { Customer } from "@open-dream/shared";
import type { RowDataPacket, PoolConnection, ResultSetHeader } from "mysql2/promise";

// ---------- CUSTOMER FUNCTIONS ----------
export const getCustomersFunction = async (
  project_idx: number
): Promise<Customer[]> => {
  const q = `
    SELECT * FROM customers
    WHERE project_idx = ?
    ORDER BY created_at ASC
  `;
  const [rows] = await db
    .promise()
    .query<(Customer & RowDataPacket)[]>(q, [project_idx]);
  return rows;
};

export const upsertCustomerFunction = async (
  connection: PoolConnection,
  project_idx: number,
  reqBody: any
) => {
  const {
    customer_id,
    first_name,
    last_name,
    email,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    zip,
    notes,
  } = reqBody;

  const finalCustomerId = 
    customer_id && customer_id.trim() !== ""
      ? customer_id
      : "C-" +
        Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join(
          ""
        );

  const query = `
    INSERT INTO customers (
      customer_id,
      project_idx,
      first_name,
      last_name,
      email,
      phone,
      address_line1,
      address_line2,
      city,
      state,
      zip,
      notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      first_name = VALUES(first_name),
      last_name = VALUES(last_name),
      email = VALUES(email),
      phone = VALUES(phone),
      address_line1 = VALUES(address_line1),
      address_line2 = VALUES(address_line2),
      city = VALUES(city),
      state = VALUES(state),
      zip = VALUES(zip),
      notes = VALUES(notes),
      updated_at = NOW()
  `;

  const values = [
    finalCustomerId,
    project_idx,
    first_name,
    last_name,
    email,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    zip,
    notes,
  ];

  const [result] = await connection.query<ResultSetHeader>(query, values);
  let id = result.insertId;
  if (!id) throw new Error("No ID provided from result");
  return { success: true, id, customer_id: finalCustomerId };
};

export const deleteCustomerFunction = async (
  connection: PoolConnection,
  project_idx: number,
  customer_id: string
): Promise<{ success: true }> => {
  const q = `DELETE FROM customers WHERE customer_id = ? AND project_idx = ?`;
  await connection.query(q, [customer_id, project_idx]);
  return { success: true };
};
