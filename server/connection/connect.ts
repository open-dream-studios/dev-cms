// server/connection/connect.ts
import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

const useDevDB =
  process.env.USE_DEV_DB === "true" && process.env.NODE_ENV !== "production";

console.log(`${useDevDB ? "DEV" : "PROD"} DB`);

const DB_HOST = useDevDB ? process.env.DEV_DB_HOST : process.env.DB_HOST;
const DB_PORT = useDevDB ? process.env.DEV_DB_PORT : process.env.DB_PORT;
const DB_PASSWORD = useDevDB
  ? process.env.DEV_DB_PASSWORD
  : process.env.DB_PASSWORD;

export const db: mysql.Pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: process.env.DB_USER!,
  password: DB_PASSWORD,
  database: process.env.DB_SCHEMA!,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
  dateStrings: true,
});
