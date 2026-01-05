// server/handlers/auth/auth_repositories.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateId } from "../../functions/data.js"; 
import admin from "../../connection/firebaseAdmin.js";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { sendEmail } from "../../util/email.js";
import { ulid } from "ulid";

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
  idToken: any,
  invite_token: string
) => {
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const { email, name = "", picture = "", uid } = decodedToken;
  // const validEmails = await getValidEmails(connection);
  // if (!validEmails.includes(email))
  //   return {
  //     status: 401,
  //     success: "false",
  //     message: "Unauthorized gmail, please ask host for permission",
  //   };

  if (!email)
    return {
      status: 401,
      success: "false",
      message: "Gmail auth error, please contact host",
    };
  const user = await getUserFunction(connection, email);

  let [first_name, ...rest] = name.split(" ");
  let last_name = rest.join(" ") || null;

  if (user) {
    if (user.auth_provider !== "google") {
      return {
        status: 402,
        success: "false",
        message: `Please log in using ${user.auth_provider}`,
      };
    }
    if (invite_token) {
      await acceptProjectInviteAfterAuth(connection, {
        token: invite_token,
        user: {
          user_id: user.user_id,
          email,
        },
      });
    }
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, admin: user.admin },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );
   
    return {
      status: 200,
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

  const newUserId = `USER-${ulid()}`;
  const insertQuery = `
    INSERT INTO users 
    (user_id, email, first_name, last_name, profile_img_src, auth_provider)
    VALUES (?)
  `;

  const values = [newUserId, email, first_name, last_name, picture, "google"];
  const [result] = await connection.query<ResultSetHeader>(insertQuery, [
    values,
  ]);
  if (result.affectedRows > 0) {
    if (invite_token) {
      await acceptProjectInviteAfterAuth(connection, {
        token: invite_token,
        user: {
          user_id: newUserId,
          email,
        },
      });
    }

    const token = jwt.sign(
      { user_id: newUserId, email, admin: 0 },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );
    return {
      status: 200,
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
  const { email, password, first_name, last_name, invite_token } = reqBody;

  // 1. Prevent duplicate users
  const existing = await getUserFunction(connection, email);
  if (existing) {
    await connection.rollback();
    return { status: 400, success: false, message: "User already exists" };
  }

  // 2. Create user
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  const newUserId = `USER-${ulid()}`;

  await connection.query(
    `
      INSERT INTO users 
      (user_id, email, password, first_name, last_name, profile_img_src)
      VALUES (?, ?, ?, ?, ?, NULL)
      `,
    [newUserId, email, hashedPassword, first_name, last_name]
  );

  // 3. Accept invitation if token exists
  if (invite_token) {
    await acceptProjectInviteAfterAuth(connection, {
      token: invite_token,
      user: {
        user_id: newUserId,
        email,
      },
    });
  }

  // 4. Issue auth token
  const jwtToken = jwt.sign(
    { user_id: newUserId, email, admin: 0 },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  return {
    status: 200,
    message: "Registration successful",
    cookies: [
      {
        name: "accessToken",
        value: jwtToken,
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

export const loginFunction = async (
  connection: PoolConnection,
  reqBody: any
) => {
  const { email, password, invite_token } = reqBody;
  // const validEmails = await getValidEmails(connection);
  // if (!validEmails.includes(email)) {
  //   return {
  //     status: 401,
  //     success: false,
  //     message: "Unauthorized email, please ask host for permission",
  //   };
  // }
  const user = await getUserFunction(connection, email);
  if (!user)
    return {
      status: 401,
      success: false,
      message: "Login failed",
    };

  if (user.auth_provider !== "local") {
    return {
      status: 401,
      success: false,
      message: `Please log in using ${user.auth_provider}`,
    };
  }

  const checkPassword = bcrypt.compareSync(password, user.password);
  if (!checkPassword) {
    return {
      status: 401,
      success: false,
      message: "This password or username is incorrect",
    };
  }

  if (invite_token) {
    await acceptProjectInviteAfterAuth(connection, {
      token: invite_token,
      user: {
        user_id: user.user_id,
        email,
      },
    });
  }

  const token = jwt.sign(
    { user_id: user.user_id, email: user.email, admin: user.admin },
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
    return { status: 400, success: false, message: "Send code failed" };
  }

  const currentTime = new Date().toISOString().slice(0, 19).replace("T", " ");
  const q2 =
    "UPDATE users SET `password_reset`=?,`password_reset_timestamp`=? WHERE user_id=?";
  const values = [resetCode, currentTime, user.user_id];
  const [result] = await connection.query<ResultSetHeader>(q2, values);

  if (result.affectedRows > 0) {
    try {
      await sendEmail({
        to: email,
        subject: "Password Reset Code",
        html: `<p>Your password reset code is: ${resetCode}</p>`,
        text: `Your password reset code is: ${resetCode}`,
      });
      return { status: 200, success: true, message: "Email sent successfully" };
    } catch (error) {
      console.error("Email send error:", error);
      return {
        status: 500,
        success: false,
        message: "Email failed to send",
      };
    }
  } else {
    return { status: 500, success: false, message: "Send code failed" };
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
      status: 400,
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
        { user_id: user.user_id, email: user.email, admin: user.admin },
        process.env.JWT_SECRET!,
        {
          expiresIn: "7d",
        }
      );
      return {
        status: 200,
        success: true,
        accessToken: token,
        message: "Reset code matched and is not expired",
      };
    } else {
      return {
        status: 401,
        success: false,
        message:
          "Reset code is more than 1 hour old and has expired, please try again",
      };
    }
  } else {
    return {
      status: 401,
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
  if (!accessToken)
    return { status: 401, success: false, message: "Password reset failed" };

  const user = await getUserFunction(connection, email);
  if (!user || user.auth_provider !== "local") {
    return { status: 401, success: false, message: "Password reset failed" };
  }

  const decoded = jwt.verify(
    accessToken,
    process.env.JWT_SECRET!
  ) as jwt.JwtPayload;
  if (decoded.email !== email && decoded.user_id !== user.user_id) {
    return { status: 401, success: false, message: "Password reset failed" };
  }

  const q = "UPDATE users SET `password`=? WHERE user_id=?";
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  const values = [hashedPassword, user.user_id];
  const [result] = await connection.query<ResultSetHeader>(q, values);

  if (result.affectedRows > 0) {
    return { status: 200, success: true, message: "User password updated" };
  } else {
    return {
      status: 500,
      success: false,
      message: "Error updating user password",
    };
  }
};

export const acceptProjectInviteAfterAuth = async (
  connection: PoolConnection,
  {
    token,
    user,
  }: {
    token: string;
    user: { user_id: string; email: string };
  }
) => {
  // 1. Lock invitation
  const [rows] = await connection.query<RowDataPacket[]>(
    `
    SELECT *
    FROM project_invitations
    WHERE token = ?
    FOR UPDATE
    `,
    [token]
  );

  if (!rows.length) {
    throw new Error("Invalid invitation token");
  }

  const invite = rows[0];

  // 2. Validate state
  if (invite.expires_at < new Date()) {
    throw new Error("Invitation expired");
  }

  if (invite.accepted_at) {
    // idempotent success
    return;
  }

  // 3. Email must match
  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new Error("Invitation email does not match registered email");
  }

  // 4. Flip user to internal (one-way)
  await connection.query(
    `
    UPDATE users
    SET type = 'internal'
    WHERE user_id = ?
    `,
    [user.user_id]
  );

  // 5. Ensure project membership (idempotent)
  await connection.query(
    `
    INSERT INTO project_users (email, project_idx, clearance)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE clearance = VALUES(clearance)
    `,
    [invite.email, invite.project_idx, invite.clearance]
  );

  // 6. Mark invitation accepted
  await connection.query(
    `
    UPDATE project_invitations
    SET accepted_at = NOW()
    WHERE id = ?
    `,
    [invite.id]
  );
};
