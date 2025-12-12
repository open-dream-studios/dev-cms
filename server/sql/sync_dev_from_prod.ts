// server/sql/sync_dev_from_prod.ts.ts
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

// RUN PROCESS -> SYNC PROD DB (STRUCTURE & DATA) TO DB
// node --loader ts-node/esm sql/sync_dev_from_prod.ts

const BACKUP_DIR = path.resolve("sql/backups");

// PROD CONNECTION
const {
  DB_HOST: PROD_DB_HOST,
  DB_PORT: PROD_DB_PORT = "3306",
  DB_USER: PROD_DB_USER,
  DB_PASSWORD: PROD_DB_PASSWORD,
  DB_SCHEMA: PROD_DB_SCHEMA,
} = process.env;

// DEV CONNECTION
const {
  DEV_DB_HOST,
  DEV_DB_PORT = "3306",
  DEV_DB_USER,
  DEV_DB_PASSWORD,
  DEV_DB_SCHEMA,
} = process.env;

if (!PROD_DB_HOST || !DEV_DB_HOST || !DEV_DB_USER || !DEV_DB_SCHEMA)
  throw new Error("Missing DB environment vars.");

const backupFile = fs
  .readdirSync(BACKUP_DIR)
  .filter((f) => f.endsWith(".sql.gz"))
  .sort()
  .pop();

if (!backupFile) throw new Error("No backup file found.");

const backupPath = path.join(BACKUP_DIR, backupFile);

console.log("Using backup:", backupPath);

// 1. Drop & recreate DEV DB
console.log("Dropping & recreating DEV database...");

const mysqlDrop = spawn(
  "mysql",
  [
    "-h",
    DEV_DB_HOST,
    "-P",
    DEV_DB_PORT,
    "-u",
    DEV_DB_USER,
    `-p${DEV_DB_PASSWORD}`,
    "-e",
    `DROP DATABASE IF EXISTS ${DEV_DB_SCHEMA}; CREATE DATABASE ${DEV_DB_SCHEMA};`,
  ],
  { stdio: "inherit" }
);

mysqlDrop.on("exit", (code) => {
  if (code !== 0) {
    console.error("Failed to drop/recreate DEV DB.");
    process.exit(code ?? 1);
  }

  console.log("DEV DB reset. Importing data...");

  // 2. Import via gunzip → mysql
  const gunzip = spawn("gunzip", ["-c", backupPath], {
    stdio: ["ignore", "pipe", "inherit"],
  });

  const mysqlImport = spawn(
    "mysql",
    [
      "-h",
      DEV_DB_HOST,
      "-P",
      DEV_DB_PORT,
      "-u",
      DEV_DB_USER,
      `-p${DEV_DB_PASSWORD}`,
      DEV_DB_SCHEMA,
    ],
    { stdio: ["pipe", "inherit", "inherit"] }
  );

  gunzip.stdout.pipe(mysqlImport.stdin);

  mysqlImport.on("exit", (importCode) => {
    if (importCode !== 0) {
      console.error("❌ Import failed.");
      process.exit(importCode ?? 1);
    }
    console.log("✅ DEV database now exactly matches PROD.");
    process.exit(0);
  });
});
