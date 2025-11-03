// server/env.ts
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Go up two levels: dist/server → server
// const envPath = path.resolve(__dirname, "../../server/.env");
const envPath = path.resolve(__dirname, "../.env");

const result = dotenv.config({ path: envPath });
if (result.error) console.error("⚠️ dotenv error:", result.error);