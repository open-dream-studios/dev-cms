// server/handlers/auth/auth_controllers.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { db } from "../../connection/connect.js";
import dotenv from "dotenv";
import {
  createUniqueUserId,
  getValidEmails,
  googleAuthFunction,
  registerFunction
} from "./auth_repositories.js";
dotenv.config();

export const googleAuth = async (req, res, connection) => {
  const { idToken } = req.body;
  if (!idToken) throw new Error("No idToken provided");
  return await googleAuthFunction(connection, idToken);
};

export const register = async (req, res, connection) => {
  const { email, password, first_name, last_name } = req.body;
  if (!email || !password || !first_name || !last_name)
    throw new Error("Missing required fields");
  return await registerFunction(connection, req.body);
};

export const login = async (req, res, connection) => {
  const { email } = req.body;
  const validEmails = await getValidEmails(connection);
  if (!validEmails.includes(email)) {
    return res.status(403).json({
      message: "Unauthorized gmail, please ask host for permission",
    });
  }

  const q = "SELECT * FROM users WHERE email = ?";

  db.query(q, [email], (err, data) => {
    // If there is an error
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json(err);
    }

    // If the data array returned was empty, nothing was found
    if (data.length === 0) {
      return res.status(404).json("User not found!");
    }

    // Otherwise, assume user was found and array with one item was returned
    // Ensure non google user (password would be null)
    if (data[0].auth_provider === "google") {
      return res.status(403).json({ message: "Please log in using Google" });
    }
    if (data[0].auth_provider === "facebook") {
      return res.status(403).json({ message: "Please log in using Facebook" });
    }
    if (data[0].auth_provider === "discord") {
      return res.status(403).json({ message: "Please log in using Discord" });
    }

    // Decrypt password
    const checkPassword = bcrypt.compareSync(
      req.body.password,
      data[0].password
    );

    // If user entered the wrong password for given username
    if (!checkPassword) {
      return res.status(400).json("Wrong password or username!");
    }

    // Otherwise, login was successful
    // Establish a secret key for the user
    const token = jwt.sign(
      { id: data[0].user_id, email: data[0].email, admin: data[0].admin },
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
    return res.status(200).json({ message: "Login successful" });
  });
};

export const logout = async (req, res, connection) => {
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
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
          expires: new Date(0),
        },
      },
    ],
  };
};

export const sendCode = async (req, res, connection) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.NODE_MAILER_ORIGIN,
      pass: process.env.NODE_MAILER_PASSKEY,
    },
  });
  const { email } = req.body;
  const resetCode = Math.floor(100000 + Math.random() * 900000);

  // Ensure email is in database already
  try {
    const q = "SELECT * FROM users WHERE email = ?";
    db.query(q, [req.body.email], (err, data) => {
      if (err) {
        return res.status(500).json(err);
      }
      if (data.length === 0) {
        return res.status(404).json("User not found!");
      }
      if (data[0].auth_provider !== "local") {
        return res
          .status(403)
          .json({ success: false, message: data[0].auth_provider });
      }

      const currentTime = new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      const q2 =
        "UPDATE users SET `password_reset`=?,`password_reset_timestamp`=? WHERE user_id=?";
      db.query(
        q2,
        [resetCode, currentTime, data[0].user_id],
        async (err, data) => {
          if (err) return res.status(500).json(err);
          if (data.affectedRows > 0) {
            try {
              await transporter.sendMail({
                from: process.env.NODE_MAILER_ORIGIN,
                to: email,
                subject: "Password Reset Code",
                text: `Your password reset code is: ${resetCode}`,
              });
              return res
                .status(200)
                .json({ success: true, message: "Email sent successfully." });
            } catch (err) {
              return res
                .status(500)
                .json({ success: false, message: "Error sending email." });
            }
          } else {
            return res
              .status(500)
              .json({ success: false, message: "Error updating database" });
          }
        }
      );
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Error searching for user" });
  }
};

export const checkCode = async (req, res, connection) => {
  const { code, email } = req.body;
  try {
    const q = "SELECT * FROM users WHERE email = ?";
    db.query(q, [email], (err, data) => {
      if (err) {
        return res.status(500).json(err);
      }
      if (data.length === 0) {
        return res.status(404).json("User not found!");
      }
      if (data[0].auth_provider !== "local") {
        return res
          .status(403)
          .json({ success: false, message: data[0].auth_provider });
      }

      function isWithinOneHour(currentTime, oldTime) {
        const currentDate = new Date(currentTime);
        const oldDate = new Date(oldTime);
        const timeDifference = (currentDate - oldDate) / (1000 * 60);
        return timeDifference > 0 && timeDifference < 60;
      }

      const currentTime = new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      if (data[0].password_reset === code) {
        if (
          data[0].password_reset_timestamp !== null &&
          isWithinOneHour(currentTime, data[0].password_reset_timestamp)
        ) {
          // Establish a secret key for the user
          const token = jwt.sign(
            { id: data[0].user_id, email: data[0].email, admin: data[0].admin },
            process.env.JWT_SECRET,
            {
              expiresIn: "7d",
            }
          );
          return res.status(200).json({
            success: true,
            accessToken: token,
            message: "Reset code matched and is not expired",
          });
        } else {
          return res.status(403).json({
            success: false,
            message:
              "Reset code is more than 1 hour old and has expired, please try again",
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: "Invalid reset code, please try again",
        });
      }
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Error searching for user" });
  }
};

export const passwordReset = async (req, res, connection) => {
  const { email, password, accessToken } = req.body;
  if (!accessToken) return res.status(401).json("Not authenticated!");

  try {
    const q = "SELECT * FROM users WHERE email = ?";
    db.query(q, [email], (err, data) => {
      if (err) {
        return res.status(500).json(err);
      }
      if (data.length === 0) {
        return res.status(404).json("User not found!");
      }
      if (data[0].auth_provider !== "local") {
        return res
          .status(403)
          .json({ success: false, message: data[0].auth_provider });
      }

      jwt.verify(accessToken, process.env.JWT_SECRET, (err) => {
        if (err) return res.status(403).json("Token is not valid!");
        const q = "UPDATE users SET `password`=? WHERE user_id=?";

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        db.query(q, [hashedPassword, data[0].user_id], (err, data) => {
          if (err) return res.status(500).json(err);
          if (data.affectedRows > 0) {
            return res.json({
              success: true,
              message: "User password updated",
            });
          } else {
            return res.status(500).json({
              success: false,
              message: "Error updating user password",
            });
          }
        });
      });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Error updating user password" });
  }
};

export const getCurrentUser = async (req, res, connection) => {
  const token = req.cookies.accessToken;
  if (!token) return null;
  const userInfo = await new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
  const q = "SELECT * FROM users WHERE user_id = ?";
  const [rows] = await connection.query(q, [userInfo.id]);
  if (!rows.length) return null;
  const { password, password_reset, password_reset_timestamp, ...user } =
    rows[0];
  return user;
};

export const updateCurrentUser = async (req, res, connection) => {
  const token = req.cookies.accessToken;
  if (!token) throw new Error("Not authenticated!");

  const userInfo = await new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
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
  const values = [...Object.values(req.body), userInfo.id];

  const q = `UPDATE users SET ${updates} WHERE user_id = ?`;
  const [result] = await connection.query(q, values);

  if (result.affectedRows > 0) {
    return { success: true };
  }

  return { success: false, message: "No user updated" };
};
