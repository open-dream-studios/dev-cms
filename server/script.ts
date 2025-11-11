import mysql from "mysql2/promise";
import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

const prodConfig = {
  host: "your-prod-host",
  user: "your-username",
  password: "your-password",
  database: "cms",
};

const devConfig = {
  host: "your-dev-host",
  user: "your-username",
  password: "your-password",
  database: "cms_dev",
};

async function runMigration(sqlCommand: string) {
  const prodConn = await mysql.createConnection(prodConfig);
  const devConn = await mysql.createConnection(devConfig);

  try {
    console.log("Running command on production DB...");
    await prodConn.query(sqlCommand);
    console.log("✅ Production DB updated.");

    console.log("Dumping updated structure...");
    await execAsync(
      `mysqldump -u ${prodConfig.user} -p${prodConfig.password} --no-data ${prodConfig.database} > dump.sql`
    );
    console.log("✅ Schema dumped to dump.sql");

    console.log("Applying command to dev DB...");
    await devConn.query(sqlCommand);
    console.log("✅ Dev DB updated.");
  } catch (err: any) {
    console.error("❌ Error:", err.message);
  } finally {
    await prodConn.end();
    await devConn.end();
  }
}

const sql = process.argv.slice(2).join(" "); // pass in your command as arg
if (!sql) {
  console.log(
    'Usage: node migrate.js "ALTER TABLE your_table ADD COLUMN new_field VARCHAR(255)"'
  );
  process.exit(1);
}

runMigration(sql);
