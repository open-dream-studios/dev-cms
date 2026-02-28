// server/handlers/modules/customers/customers_repositories.ts
import { db } from "../../../connection/connect.js";
import type { Customer } from "@open-dream/shared";
import type {
  RowDataPacket,
  PoolConnection,
  ResultSetHeader,
} from "mysql2/promise";
import { ulid } from "ulid";

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

export const getCustomerByEmailOrPhoneFunction = async (
  project_idx: number,
  email?: string | null,
  phone?: string | null
): Promise<Customer | null> => {
  const trimmedEmail = email?.trim() || null;
  const trimmedPhone = phone?.trim() || null;

  if (!trimmedEmail && !trimmedPhone) return null;

  let q = `
    SELECT * FROM customers
    WHERE project_idx = ?
  `;
  const params: Array<number | string> = [project_idx];

  if (trimmedEmail && trimmedPhone) {
    q += ` AND (email = ? OR phone = ?)`;
    params.push(trimmedEmail, trimmedPhone);
  } else if (trimmedEmail) {
    q += ` AND email = ?`;
    params.push(trimmedEmail);
  } else {
    q += ` AND phone = ?`;
    params.push(trimmedPhone as string);
  }

  q += ` LIMIT 1`;

  const [rows] = await db
    .promise()
    .query<(Customer & RowDataPacket)[]>(q, params);

  return rows.length ? rows[0] : null;
};

export const getCustomerByEmailFunction = async (
  project_idx: number,
  email: string
): Promise<Customer | null> => {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) return null;

  const q = `
    SELECT * FROM customers
    WHERE project_idx = ? AND email = ?
    LIMIT 1
  `;

  const [rows] = await db
    .promise()
    .query<(Customer & RowDataPacket)[]>(q, [project_idx, trimmedEmail]);

  return rows.length ? rows[0] : null;
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

  const trimmedEmail = email?.trim() || null;
  const trimmedPhone = phone?.trim() || null;

  // -------------------------
  // 1️⃣ UPDATE EXISTING
  // -------------------------
  if (customer_id) {
    const updateQuery = `
      UPDATE customers
      SET
        first_name = ?,
        last_name = ?,
        email = ?,
        phone = ?,
        address_line1 = ?,
        address_line2 = ?,
        city = ?,
        state = ?,
        zip = ?,
        notes = ?,
        updated_at = NOW()
      WHERE customer_id = ? AND project_idx = ?
    `;

    await connection.query(updateQuery, [
      first_name.toLowerCase(),
      last_name.toLowerCase(),
      trimmedEmail,
      trimmedPhone,
      address_line1,
      address_line2,
      city,
      state,
      zip,
      notes,
      customer_id,
      project_idx,
    ]);

    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT id FROM customers WHERE customer_id = ? AND project_idx = ?`,
      [customer_id, project_idx]
    );

    return { success: true, id: rows[0].id, customer_id };
  }

  // -------------------------
  // 2️⃣ CHECK FOR DUPLICATES
  // -------------------------
  if (trimmedEmail) {
    const [emailRows] = await connection.query<RowDataPacket[]>(
      `SELECT id FROM customers WHERE project_idx = ? AND email = ?`,
      [project_idx, trimmedEmail]
    );

    if (emailRows.length) {
      return {
        success: false,
        code: "duplicate-email",
        message: "This email is already used by another customer",
      };
    }
  }

  if (trimmedPhone) {
    const [phoneRows] = await connection.query<RowDataPacket[]>(
      `SELECT id FROM customers WHERE project_idx = ? AND phone = ?`,
      [project_idx, trimmedPhone]
    );

    if (phoneRows.length) {
      return {
        success: false,
        code: "duplicate-phone",
        message: "This phone number is already used by another customer",
      };
    }
  }

  // -------------------------
  // 3️⃣ INSERT NEW
  // -------------------------
  const newCustomerId = `CUST-${ulid()}`;

  const insertQuery = `
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
  `;

  const [result] = await connection.query<ResultSetHeader>(insertQuery, [
    newCustomerId,
    project_idx,
    first_name.toLowerCase(),
    last_name.toLowerCase(),
    trimmedEmail,
    trimmedPhone,
    address_line1,
    address_line2,
    city,
    state,
    zip,
    notes,
  ]);

  return {
    success: true,
    id: result.insertId,
    customer_id: newCustomerId,
  };
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
