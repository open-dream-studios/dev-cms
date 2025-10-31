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

const getUserFunction = async (connection, email) => {
  const q = "SELECT * FROM users WHERE email = ?";
  const [rows] = await connection.query(q, [email]);
  return rows.length ? rows[0] : null;
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

  const user = await getUserFunction(connection, email);

  let [first_name, ...rest] = name.split(" ");
  let last_name = rest.join(" ") || null;

  if (user) {
    const token = jwt.sign(
      { id: user.user_id, email: user.email, admin: user.admin },
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
  const user = await getUserFunction(connection, email);
  if (user) return { success: false, message: "User already exists!" };
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  const newUserId = await createUniqueUserId(connection);

  const q1 =
    "INSERT INTO users (`user_id`,`email`,`password`,`first_name`,`last_name`,`profile_img_src`) VALUE (?)";
  const values1 = [
    newUserId,
    email,
    hashedPassword,
    first_name,
    last_name,
    null,
  ];

  const [result] = await connection.query(q1, [values1]);
  if (result.affectedRows > 0) {
    const token = jwt.sign(
      { id: newUserId, email, admin: 0 },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
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

export const loginFunction = async (connection, reqBody) => {
  const { email, password } = reqBody;
  const validEmails = await getValidEmails(connection);
  if (!validEmails.includes(email)) {
    return {
      success: false,
      message: "Unauthorized email, please ask host for permission",
    };
  }
  const user = await getUserFunction(connection, email);
  if (!user)
    return {
      success: false,
      message: "Login failed",
    };

  if (user.auth_provider === "google") {
    return { success: false, message: "Please log in using Google" };
  }
  if (user.auth_provider === "facebook") {
    return { success: false, message: "Please log in using Facebook" };
  }
  if (user.auth_provider === "discord") {
    return { success: false, message: "Please log in using Discord" };
  }

  const checkPassword = bcrypt.compareSync(password, user.password);
  if (!checkPassword) {
    return {
      success: false,
      message: "Login failed",
    };
  }

  const token = jwt.sign(
    { id: user.user_id, email: user.email, admin: user.admin },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return {
    message: "Login successful",
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
};

export const sendCodeFunction = async (connection, reqBody) => {
  const { email } = reqBody;

  const transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    auth: {
      user: "apikey",
      pass: process.env.SENDGRID_API_KEY,
    },
  });
  const resetCode = Math.floor(100000 + Math.random() * 900000);

  const user = await getUserFunction(connection, email);
  if (!user || user.auth_provider !== "local")
    return {
      success: "false",
      message: "Send code failed",
    };

  const currentTime = new Date().toISOString().slice(0, 19).replace("T", " ");
  const q2 =
    "UPDATE users SET `password_reset`=?,`password_reset_timestamp`=? WHERE user_id=?";

  const values = [resetCode, currentTime, user.user_id];
  const [result] = await connection.query(q2, values);
  if (result.affectedRows > 0) {
    await transporter.sendMail({
      from: process.env.NODE_MAILER_ORIGIN,
      to: email,
      subject: "Password Reset Code",
      text: `Your password reset code is: ${resetCode}`,
    });
    return { success: true, messagE: "Email sent successfully" };
  } else {
    return { success: false, messagE: "Send code failed" };
  }
};

export const checkCodeFunction = async (connection, reqBody) => {
  const { code, email } = reqBody;
  const user = await getUserFunction(connection, email);
  if (!user || user.auth_provider !== "local") {
    return {
      success: false,
      message: "Check code failed",
    };
  }
  function isWithinOneHour(currentTime, oldTime) {
    const currentDate = new Date(currentTime);
    const oldDate = new Date(oldTime);
    const timeDifference = (currentDate - oldDate) / (1000 * 60);
    return timeDifference > 0 && timeDifference < 60;
  }
  const currentTime = new Date().toISOString().slice(0, 19).replace("T", " ");
  if (user.password_reset === code) {
    if (
      user.password_reset_timestamp !== null &&
      isWithinOneHour(currentTime, user.password_reset_timestamp)
    ) {
      const token = jwt.sign(
        { id: user.user_id, email: user.email, admin: user.admin },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );
      return {
        success: true,
        accessToken: token,
        message: "Reset code matched and is not expired",
      };
    } else {
      return {
        success: false,
        message:
          "Reset code is more than 1 hour old and has expired, please try again",
      };
    }
  } else {
    return {
      success: false,
      message: "Check code failed",
    };
  }
};

export const passwordResetFunction = async (connection, reqBody) => {
  const { email, password, accessToken } = reqBody;
  if (!accessToken) return { success: false, message: "Password reset failed" };

  const user = await getUserFunction(connection, email);
  if (!user || user.auth_provider !== "local") {
    return { success: false, message: "Password reset failed" };
  }

  await new Promise((resolve, reject) => {
    jwt.verify(accessToken, process.env.JWT_SECRET, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const q = "UPDATE users SET `password`=? WHERE user_id=?";
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  const values = [hashedPassword, user.user_id];
  const [result] = await connection.query(q, values);

  if (result.affectedRows > 0) {
    return { success: true, message: "User password updated" };
  } else {
    return { success: false, message: "Error updating user password" };
  }
};
