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
// gunzip backup-cms-2025-11-05T22-52-00.sql.gz

// (You can rezip with)
// gzip backup-cms-2025-11-05T22-52-00.sql

//

const {
  DB_HOST,
  DB_PORT = "3306",
  DB_USER,
  DB_PASSWORD,
  DB_SCHEMA,
} = process.env;

const BACKUP_DIR = path.resolve(__dirname, "backups");

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_SCHEMA) {
  console.error(
    "Missing required env vars. Check .env for MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB."
  );
  process.exit(2);
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

// filename
const now = new Date();
const localTs = now
  .toLocaleString("sv-SE", { timeZone: "America/New_York" }) // ISO-like, local tz
  .replace(/:/g, "-")
  .replace(",", "")
  .replace(/\s+/g, "T"); // gives format like 2025-11-05T20-10-13
const filename = `backup-${DB_SCHEMA}-${localTs}.sql.gz`;
const filepath = path.join(BACKUP_DIR, filename);

// We'll set MYSQL_PWD in env for mysqldump so password isn't visible in arg list
const env = { ...process.env, MYSQL_PWD: DB_PASSWORD };

// build mysqldump args (safe for InnoDB)
const dumpArgs = [
  `-h`,
  DB_HOST,
  `-P`,
  DB_PORT,
  `-u`,
  DB_USER,
  "--single-transaction",
  "--quick",
  "--routines",
  "--events",
  "--triggers",
  DB_SCHEMA,
];

// spawn mysqldump
console.log("Starting dump to:", filepath);
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

// pipe mysqldump -> gzip -> file
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
    // delete possibly-corrupted file
    try {
      fs.unlinkSync(filepath);
    } catch (e) {}
    process.exit(3);
  }

  console.log("Dump finished:", filepath);

  // compute sha256
  try {
    const fileBuffer = fs.readFileSync(filepath);
    const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    fs.writeFileSync(filepath + ".sha256", hash);
    console.log("Checksum written:", filepath + ".sha256");

    await uploadToS3(filepath);
    await uploadToS3(filepath + ".sha256");
    console.log("✅ Uploaded backup + checksum to S3");
  } catch (err) {
    console.error("Checksum failed:", err);
  }
  console.log("Backup job complete.");
  process.exit(0);
});

mysqldump.on("error", (err) => {
  console.error("Failed to spawn mysqldump. Is it installed and in PATH?", err);
  process.exit(4);
});
gzip.on("error", (err) => {
  console.error("gzip spawn failed:", err);
  process.exit(5);
});
