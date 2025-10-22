// server/handlers/modules/customers/customers_repositories.js
import { db } from "../../../connection/connect.js";

// ---------- CUSTOMER FUNCTIONS ----------
export const getCustomersFunction = async (project_idx) => {
  const q = `
    SELECT * FROM customers
    WHERE project_idx = ?
    ORDER BY created_at ASC
  `;
  try {
    const [rows] = await db.promise().query(q, [project_idx]);
    return rows;
  } catch (err) {
    console.error("❌ Function Error -> getCustomersFunction: ", err);
    return [];
  }
};

export const upsertCustomerFunction = async (project_idx, reqBody) => {
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

  try {
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

    const [result] = await db.promise().query(query, values);

    // Get final insert ID
    let id = result.insertId;
    if (!id && customer_id) {
      const [rows] = await db
        .promise()
        .query(
          "SELECT id FROM customers WHERE customer_id = ? AND project_idx = ?",
          [finalCustomerId, project_idx]
        );
      id = rows[0]?.id;
    }

    return {
      success: true,
      id,
      customer_id: finalCustomerId,
    };
  } catch (err) {
    console.error("❌ Function Error -> upsertCustomerFunction: ", err);
    return {
      success: false,
      customer_id: null,
    };
  }
};

export const deleteCustomerFunction = async (project_idx, customer_id) => {
  const q = `DELETE FROM customers WHERE customer_id = ? AND project_idx = ?`;
  try {
    await db.promise().query(q, [customer_id, project_idx]);
    return true;
  } catch (err) {
    console.error("❌ Function Error -> deleteCustomerFunction: ", err);
    return false;
  }
};
