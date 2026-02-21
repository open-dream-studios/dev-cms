// server/handlers/auth/auth_controllers.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {
  acceptProjectInviteAfterAuth,
  checkCodeFunction,
  getCurrentUserBillingFunction,
  getCurrentUserSubscriptionFunction,
  getUserByUserIdFunction,
  googleAuthFunction,
  loginFunction,
  passwordResetFunction,
  registerFunction,
  sendCodeFunction,
} from "./auth_repositories.js";
import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import type { Request, Response } from "express";
dotenv.config();

export const googleAuth = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { idToken, invite_token } = req.body;
  if (!idToken) throw new Error("No idToken provided");
  return await googleAuthFunction(connection, idToken, invite_token);
};

export const register = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { email, password, first_name, last_name } = req.body;
  if (!email || !password || !first_name || !last_name)
    throw new Error("Missing required fields");
  return await registerFunction(connection, req.body);
};

export const login = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { email, password } = req.body;
  if (!email || !password)
    return {
      status: 400,
      success: "false",
      message: "Missing required fields",
    };
  return await loginFunction(connection, req.body);
};

export const logout = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const token = req.cookies.accessToken;
  if (!token) throw new Error("Not authenticated!");
  return {
    message: "Logout successful",
    cookies: [
      {
        name: "accessToken",
        value: "",
        options: {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          path: "/",
          expires: new Date(0),
        },
      },
    ],
  };
};

export const sendCode = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { email } = req.body;
  if (!email) return { success: "false", message: "Missing required fields" };
  return await sendCodeFunction(connection, req.body);
};

export const checkCode = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { code, email } = req.body;
  if (!code || !email)
    return { success: "false", message: "Missing required fields" };
  return await checkCodeFunction(connection, req.body);
};

export const passwordReset = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { email, password, accessToken } = req.body;
  if (!email || !password || !accessToken)
    return { success: "false", message: "Missing required fields" };
  return await passwordResetFunction(connection, req.body);
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const token = req.cookies.accessToken;
  if (!token) return { user: null };
  const userInfo: any = await new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
  const q = "SELECT * FROM users WHERE user_id = ?";
  const [rows] = await connection.query<RowDataPacket[]>(q, [userInfo.user_id]);
  if (!rows.length) return null;
  const {
    password,
    password_reset,
    password_reset_timestamp,
    stripe_customer_id,
    ...user
  } = rows[0];
  return { user };
};

export const updateCurrentUser = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const token = req.cookies.accessToken;
  if (!token) throw new Error("Not authenticated!");

  const userInfo: any = await new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
  if (Object.keys(req.body).length === 0) {
    return { success: false, message: "No fields to update" };
  }

  const updates = Object.entries(req.body)
    .map(([key]) => `\`${key}\` = ?`)
    .join(", ");
  const values = [...Object.values(req.body), userInfo.user_id];

  const q = `UPDATE users SET ${updates} WHERE user_id = ?`;
  const [result] = await connection.query<ResultSetHeader>(q, values);

  if (result.affectedRows > 0) {
    return { success: true };
  }

  return { success: false, message: "No user updated" };
};

export const acceptInvite = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const { token } = req.body;
  const user = req.user;
  if (!user || !user.user_id || !user.email) {
    return { status: 401, success: false, message: "Unauthorized" };
  }
  if (!token) {
    return { status: 400, success: false, message: "Missing invite token" };
  }
  await acceptProjectInviteAfterAuth(connection, {
    token,
    user: {
      user_id: user.user_id,
      email: user.email,
    },
  });
  return { status: 200, success: true };
};

export const getCurrentUserSubscription = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const userId = req.user?.user_id;
  if (!userId) return { success: false };
  return await getCurrentUserSubscriptionFunction(connection, userId);
};

export const getCurrentUserBilling = async (
  req: Request,
  res: Response,
  connection: PoolConnection
) => {
  const userId = req.user?.user_id;
  if (!userId) return { success: false };
  const user = await getUserByUserIdFunction(connection, userId);
  if (!user || !user.stripe_customer_id) return { success: false };
  return await getCurrentUserBillingFunction(user.stripe_customer_id);
};
