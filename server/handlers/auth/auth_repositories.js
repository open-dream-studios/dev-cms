// server/handlers/auth/auth_repositories.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { db } from "../../connection/connect.js";
import { generateId } from "../../functions/data.js";
import dotenv from "dotenv";
import admin from "../../connection/firebaseAdmin.js";
dotenv.config();

const checkUserIdUnique = async (connection, userId) => {
  const q = `
    SELECT * FROM users
    WHERE user_id = ?
  `;
  const [rows] = await connection.query(q, [userId]);
  return rows.length === 0;
};

export const createUniqueUserId = async (connection) => {
  let userId;
  let isUnique = false;
  while (!isUnique) {
    userId = generateId(15);
    isUnique = await checkUserIdUnique(connection, userId);
  }
  return userId;
};

export const getValidEmails = async (connection) => {
  const q = "SELECT email FROM project_users";
  const [rows] = await connection.query(q, []);
  return rows.map((row) => row.email);
};

export const googleAuthFunction = async (connection, idToken) => {
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const { email, name = "", picture = "", uid } = decodedToken;
  const validEmails = await getValidEmails(connection);
  if (!validEmails.includes(email))
    return {
      success: "false",
      message: "Unauthorized gmail, please ask host for permission",
    };

  const q = "SELECT * FROM users WHERE email = ?";
  const [data] = await connection.query(q, [email]);

  let [first_name, ...rest] = name.split(" ");
  let last_name = rest.join(" ") || null;

  if (data.length) {
    // If user exists, generate token and log them in
    const token = jwt.sign(
      { id: data[0].user_id, email: data[0].email, admin: data[0].admin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return {
      message: "Google login successful",
      cookies: [
        {
          name: "accessToken",
          value: token,
          options: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          },
        },
      ],
    };
  }
  // Otherwise create a new user
  const newUserId = await createUniqueUserId(connection);
  const insertQuery = `
    INSERT INTO users 
    (user_id, email, first_name, last_name, profile_img_src, auth_provider)
    VALUES (?)
  `;
  const values = [newUserId, email, first_name, last_name, picture, "google"];
  const [result] = await connection.query(insertQuery, [values]);
  if (result.affectedRows > 0) {
    const token = jwt.sign(
      { id: newUserId, email, admin: 0 },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return {
      message: "Google login successful",
      cookies: [
        {
          name: "accessToken",
          value: token,
          options: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          },
        },
      ],
    };
  }
  return null;
};

export const registerFunction = async (connection, reqBody) => {
  const { email, password, first_name, last_name } = reqBody;

  const validEmails = await getValidEmails(connection);
  if (!validEmails.includes(email)) {
    return {
      success: "false",
      message: "Unauthorized gmail, please ask host for permission",
    };
  }

  const q = "SELECT * FROM users WHERE email = ?";

  db.query(q, [req.body.email], (err, data) => {
    if (err) {
      console.error("Registration error:", err);
      return res.status(500).json(err);
    }
    if (data.length)
      return res.status(409).json({ error: "User already exists!" });

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(req.body.password, salt);

    createUniqueUserId(connection)
      .then((newUserId) => {
        const q1 =
          "INSERT INTO users (`user_id`,`email`,`password`,`first_name`,`last_name`,`profile_img_src`) VALUE (?)";
        const values1 = [
          newUserId,
          req.body.email,
          hashedPassword,
          req.body.first_name,
          req.body.last_name,
          req.body.profile_img_src,
        ];

        db.query(q1, [values1], (err, data) => {
          if (err) {
            console.error("Registration error:", err);
            return res.status(500).json(err);
          }
          const token = jwt.sign(
            { id: newUserId, email: req.body.email, admin: 0 },
            process.env.JWT_SECRET,
            {
              expiresIn: "7d",
            }
          );
          res.cookie("accessToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });
          return res.status(200).json({ message: "Registration successful" });
        });
      })
      .catch((error) => {
        console.error("Google auth error:", error);
        return res.status(500).json(error);
      });
  });
};
