// server/handlers/auth/auth_repositories.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as nodemailer from "nodemailer";
import { db } from "../../connection/connect.js";
import { generateId } from "../../functions/data.js";
import dotenv from "dotenv";
import admin from "../../connection/firebaseAdmin.js";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import sgMail from "@sendgrid/mail";
dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_EMAIL_API_KEY!);

const checkUserIdUnique = async (
  connection: PoolConnection,
  userId: string
) => {
  const q = `
    SELECT * FROM users
    WHERE user_id = ?
  `;
  const [rows] = await connection.query<RowDataPacket[]>(q, [userId]);
  return rows.length === 0;
};

export const createUniqueUserId = async (connection: PoolConnection) => {
  let userId;
  let isUnique = false;
  while (!isUnique) {
    userId = generateId(15);
    isUnique = await checkUserIdUnique(connection, userId);
  }
  return userId;
};

export const getValidEmails = async (connection: PoolConnection) => {
  const q = "SELECT email FROM project_users";
  const [rows] = await connection.query<RowDataPacket[]>(q, []);
  return rows.map((row) => row.email);
};

export const getUserFunction = async (
  connection: PoolConnection,
  email: string
) => {
  const q = "SELECT * FROM users WHERE email = ?";
  const [rows] = await connection.query<RowDataPacket[]>(q, [email]);
  return rows.length ? rows[0] : null;
};

export const googleAuthFunction = async (
  connection: PoolConnection,
  idToken: any
) => {
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const { email, name = "", picture = "", uid } = decodedToken;
  const validEmails = await getValidEmails(connection);
  if (!validEmails.includes(email))
    return {
      success: "false",
      message: "Unauthorized gmail, please ask host for permission",
    };

  if (!email)
    return {
      success: "false",
      message: "Gmail auth error, please contact host",
    };
  const user = await getUserFunction(connection, email);

  let [first_name, ...rest] = name.split(" ");
  let last_name = rest.join(" ") || null;

  if (user) {
    const token = jwt.sign(
      { id: user.user_id, email: user.email, admin: user.admin },
      process.env.JWT_SECRET!,
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
            secure: true,
            sameSite: "none",
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
  console.log(email, first_name);
  const values = [newUserId, email, first_name, last_name, picture, "google"];
  const [result] = await connection.query<ResultSetHeader>(insertQuery, [
    values,
  ]);
  if (result.affectedRows > 0) {
    const token = jwt.sign(
      { id: newUserId, email, admin: 0 },
      process.env.JWT_SECRET!,
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
            secure: true,
            sameSite: "none",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          },
        },
      ],
    };
  }
  return null;
};

export const registerFunction = async (
  connection: PoolConnection,
  reqBody: any
) => {
  const { email, password, first_name, last_name } = reqBody;
  const validEmails = await getValidEmails(connection);
  if (!validEmails.includes(email)) {
    return {
      status: 401,
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

  const [result] = await connection.query<ResultSetHeader>(q1, [values1]);
  if (result.affectedRows > 0) {
    const token = jwt.sign(
      { id: newUserId, email, admin: 0 },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      }
    );
    return {
      message: "Registration successful",
      status: 200,
      cookies: [
        {
          name: "accessToken",
          value: token,
          options: {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000,
          },
        },
      ],
    };
  }
  return null;
};

export const loginFunction = async (
  connection: PoolConnection,
  reqBody: any
) => {
  const { email, password } = reqBody;
  const validEmails = await getValidEmails(connection);
  if (!validEmails.includes(email)) {
    return {
      status: 401,
      success: false,
      message: "Unauthorized email, please ask host for permission",
    };
  }
  const user = await getUserFunction(connection, email);
  if (!user)
    return {
      status: 401,
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
      status: 401,
      success: false,
      message: "This password or username is incorrect",
    };
  }

  const token = jwt.sign(
    { id: user.user_id, email: user.email, admin: user.admin },
    process.env.JWT_SECRET!,
    {
      expiresIn: "7d",
    }
  );

  return {
    message: "Login successful",
    status: 200,
    cookies: [
      {
        name: "accessToken",
        value: token,
        options: {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          path: "/",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        },
      },
    ],
  };
};

export const sendCodeFunction = async (
  connection: PoolConnection,
  reqBody: any
) => {
  const { email } = reqBody;
  const resetCode = Math.floor(100000 + Math.random() * 900000);

  const user = await getUserFunction(connection, email);
  if (!user || user.auth_provider !== "local") {
    return { success: false, message: "Send code failed" };
  }

  const currentTime = new Date().toISOString().slice(0, 19).replace("T", " ");
  const q2 =
    "UPDATE users SET `password_reset`=?,`password_reset_timestamp`=? WHERE user_id=?";
  const values = [resetCode, currentTime, user.user_id];
  const [result] = await connection.query<ResultSetHeader>(q2, values);

  if (result.affectedRows > 0) {
    try {
      await sgMail.send({
        to: email,
        from: process.env.NODE_MAILER_ORIGIN!,
        subject: "Password Reset Code",
        text: `Your password reset code is: ${resetCode}`,
      });
      return { success: true, message: "Email sent successfully" };
    } catch (error) {
      console.error("SendGrid error:", error);
      return { success: false, message: "SendGrid failed to send email" };
    }
  } else {
    return { success: false, message: "Send code failed" };
  }
};

export const checkCodeFunction = async (
  connection: PoolConnection,
  reqBody: any
) => {
  const { code, email } = reqBody;
  const user = await getUserFunction(connection, email);
  if (!user || user.auth_provider !== "local") {
    return {
      success: false,
      message: "Check code failed",
    };
  }
  function isWithinOneHour(currentTime: string, oldTime: string): boolean {
    const currentDate = new Date(currentTime).getTime();
    const oldDate = new Date(oldTime).getTime();
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
        process.env.JWT_SECRET!,
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

export const passwordResetFunction = async (
  connection: PoolConnection,
  reqBody: any
) => {
  const { email, password, accessToken } = reqBody;
  if (!accessToken) return { success: false, message: "Password reset failed" };

  const user = await getUserFunction(connection, email);
  if (!user || user.auth_provider !== "local") {
    return { success: false, message: "Password reset failed" };
  }

  const decoded = jwt.verify(
    accessToken,
    process.env.JWT_SECRET!
  ) as jwt.JwtPayload;
  if (decoded.email !== email && decoded.user_id !== user.user_id) {
    return { success: false, message: "Password reset failed" };
  }

  const q = "UPDATE users SET `password`=? WHERE user_id=?";
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  const values = [hashedPassword, user.user_id];
  const [result] = await connection.query<ResultSetHeader>(q, values);

  if (result.affectedRows > 0) {
    return { success: true, message: "User password updated" };
  } else {
    return { success: false, message: "Error updating user password" };
  }
};
