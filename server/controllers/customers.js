// server/controllers/customers.js
import { db } from "../connection/connect.js";
import crypto from "crypto";

// ✅ Get all customers for a project
export const getCustomers = (req, res) => {
  const { project_idx } = req.body;

  if (!project_idx) {
    return res.status(400).json({ error: "project_idx is required" });
  }

  const q = "SELECT * FROM customers WHERE project_idx = ?";

  db.query(q, [project_idx], (err, rows) => {
    if (err) {
      console.error("❌ Get customers error:", err);
      return res.status(500).json({ error: "Failed to fetch customers" });
    }
    return res.json({ customers: rows });
  });
};

// ✅ Insert or update customer by customer_id
export const upsertCustomer = async (req, res) => {
  const {
    project_idx,
    customerId,
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
  } = req.body;

  if (!project_idx || !first_name || !last_name) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const custId = customerId || crypto.randomBytes(8).toString("hex");

    const q = `
      INSERT INTO customers (
        project_idx, customer_id, first_name, last_name,
        email, phone, address_line1, address_line2,
        city, state, zip, notes
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
      project_idx,
      custId,
      first_name,
      last_name,
      email || null,
      phone || null,
      address_line1 || null,
      address_line2 || null,
      city || null,
      state || null,
      zip || null,
      notes || null,
    ];

    const [result] = await db.promise().query(q, values);

    res.status(201).json({
      customer: {
        id: result.insertId,
        customerId: custId,
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
      },
    });
  } catch (err) {
    console.error("❌ Upsert customer error:", err);
    res.status(500).json({ error: "Failed to add/update customer" });
  }
};

// ✅ Delete customer(s) by id
export const deleteCustomer = (req, res) => {
  const { project_idx, id } = req.body;

  if (!project_idx || !id) {
    return res.status(400).json({ error: "project_idx and id required" });
  }

  const q = "DELETE FROM customers WHERE project_idx = ? AND id = ?";

  db.query(q, [project_idx, id], (err, result) => {
    if (err) {
      console.error("❌ Delete customer error:", err);
      return res.status(500).json({ error: "Failed to delete customer" });
    }

    res.status(200).json({
      success: true,
      deleted: result.affectedRows,
    });
  });
};

export const autoCompleteAddress = async (req, res) => {
  const { address, sessiontoken } = req.body;

  if (!address || !sessiontoken) {
    return res.status(400).json({ error: "Missing address or sessiontoken" });
  }

  // Priority location: Rochester, NY
  const priorityLat = 43.1566;
  const priorityLng = -77.6088;
  const radius = 200000; // 200 km radius (adjust if needed)

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    address
  )}&key=${
    process.env.GOOGLE_API_KEY
  }&sessiontoken=${sessiontoken}&components=country:us&location=${priorityLat},${priorityLng}&radius=${radius}`;

  try {
    const googleRes = await fetch(url);
    const data = await googleRes.json();
    res.json(data);
  } catch (err) {
    console.error("Autocomplete error:", err);
    res.status(500).json({ error: "Autocomplete failed" });
  }
};

export const addressDetails = async (req, res) => {
  const { place_id, sessiontoken } = req.body;

  if (!place_id || !sessiontoken) {
    return res.status(400).json({ error: "Missing place_id or sessiontoken" });
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&key=${process.env.GOOGLE_API_KEY}&sessiontoken=${sessiontoken}`;

  try {
    const googleRes = await fetch(url);
    const data = await googleRes.json();
    res.json(data);
  } catch (err) {
    console.error("Details error:", err);
    res.status(500).json({ error: "Place details failed" });
  }
};
