// server/handlers/modules/customers/customers_repositories.js
import { db } from "../../../connection/connect.js";

// ---------- CUSTOMER FUNCTIONS ----------
export const getCustomersFunction = async (project_idx) => {
  const q = `
    SELECT * FROM customers
    WHERE project_idx = ?
    ORDER BY created_at ASC
  `;
  const [rows] = await db.promise().query(q, [project_idx]);
  return rows;
};

export const upsertCustomerFunction = async (
  connection,
  project_idx,
  reqBody
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

  const [result] = await connection.query(query, values);

  let id = result.insertId;
  if (!id && customer_id) {
    const [rows] = await connection.query(
      "SELECT id FROM customers WHERE customer_id = ? AND project_idx = ?",
      [finalCustomerId, project_idx]
    );
    id = rows[0]?.id;
  }

  if (!id) throw new Error("No ID provided from result");

  return { success: true, id, customer_id: finalCustomerId };
};

export const deleteCustomerFunction = async (
  connection,
  project_idx,
  customer_id
) => {
  const q = `DELETE FROM customers WHERE customer_id = ? AND project_idx = ?`;
  await connection.query(q, [customer_id, project_idx]);
  return { success: true };
};
