// server/sql/sql_backup.ts
import { uploadToS3 } from "./S3.js";
import type { ChildProcessByStdio } from "child_process";
import type { Writable, Readable } from "stream";
import { spawn } from "child_process";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// INSTRUCTIONS
// Run command
// node --loader ts-node/esm sql/sql_backup.ts 
// Add a main function

// ZIP COMMANDS
// gunzip backup-cms-2025-11-05T22-52-00.sql.gz

// (You can rezip with)
// gzip backup-cms-2025-11-05T22-52-00.sql

export async function runSqlBackupJob(): Promise<void> {
  const {
    DB_HOST,
    DB_PORT = "3306",
    DB_USER,
    DB_PASSWORD,
    DB_SCHEMA,
  } = process.env;

  const BACKUP_DIR = path.resolve(__dirname, "backups");

  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_SCHEMA) {
    throw new Error(
      "Missing required env vars. Check .env for MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB."
    );
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // clear backups folder
  for (const file of fs.readdirSync(BACKUP_DIR)) {
    const fullPath = path.join(BACKUP_DIR, file);
    try {
      fs.unlinkSync(fullPath);
      console.log("Deleted old temp file:", file);
    } catch (err) {
      console.warn("Could not delete file:", file, err);
    }
  }

  const now = new Date();
  const localTs = now
    .toLocaleString("sv-SE", { timeZone: "America/New_York" })
    .replace(/:/g, "-")
    .replace(",", "")
    .replace(/\s+/g, "T");

  const filename = `backup-${DB_SCHEMA}-${localTs}.sql.gz`;
  const filepath = path.join(BACKUP_DIR, filename);

  const env = { ...process.env, MYSQL_PWD: DB_PASSWORD };

  const dumpArgs = [
    "-h",
    DB_HOST,
    "-P",
    DB_PORT,
    "-u",
    DB_USER,
    "--single-transaction",
    "--quick",
    "--routines",
    "--events",
    "--triggers",
    DB_SCHEMA,
  ];

  console.log("Starting dump to:", filepath);

  return new Promise<void>((resolve, reject) => {
    const mysqldump = spawn("mysqldump", dumpArgs, {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const gzip: ChildProcessByStdio<Writable, Readable, null> = spawn(
      "gzip",
      ["-c"],
      {
        stdio: ["pipe", "pipe", "inherit"],
      }
    );

    mysqldump.stdout.pipe(gzip.stdin);

    const outStream = fs.createWriteStream(filepath);
    gzip.stdout.pipe(outStream);

    let dumpErr = "";

    if (mysqldump.stderr)
      mysqldump.stderr.on("data", (d: any) => (dumpErr += d.toString()));

    (gzip.stderr as any)?.on("data", (d: any) =>
      console.error("gzip error:", d.toString())
    );

    outStream.on("finish", async () => {
      if (dumpErr) {
        console.error("mysqldump stderr:", dumpErr);
        try {
          fs.unlinkSync(filepath);
        } catch {}
        return reject(new Error("mysqldump failed"));
      }

      console.log("Dump finished:", filepath);

      try {
        const fileBuffer = fs.readFileSync(filepath);
        const hash = crypto
          .createHash("sha256")
          .update(fileBuffer)
          .digest("hex");

        fs.writeFileSync(filepath + ".sha256", hash);
        console.log("Checksum written:", filepath + ".sha256");

        await uploadToS3(filepath);
        await uploadToS3(filepath + ".sha256");

        console.log("✅ Uploaded backup + checksum to S3");
        console.log("Backup job complete.");

        resolve();
      } catch (err) {
        console.error("Checksum failed:", err);
        reject(err);
      }
    });

    mysqldump.on("error", (err) => {
      console.error(
        "Failed to spawn mysqldump. Is it installed and in PATH?",
        err
      );
      reject(err);
    });

    gzip.on("error", (err) => {
      console.error("gzip spawn failed:", err);
      reject(err);
    });
  });
}