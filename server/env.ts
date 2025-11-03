// // server/env.ts
// import path from "path";
// import { fileURLToPath } from "url";
// import dotenv from "dotenv";
// import fs from "fs";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Go up two levels: dist/server → server
// // const envPath = path.resolve(__dirname, "../../server/.env");
// const envPath = path.resolve(__dirname, "../.env");

// // const result = dotenv.config({ path: envPath });
// // if (result.error) console.error("⚠️ dotenv error:", result.error);

// if (fs.existsSync(envPath)) {
//   dotenv.config({ path: envPath });
//   console.log(`✅ Loaded environment from ${envPath}`);
// } else {
//   console.log("⚠️ No .env file found — using environment variables only");
// }