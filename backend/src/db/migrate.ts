import path from "node:path";
import fs from "node:fs";
import { logger } from "../lib/logger.js";
import { query } from "./db.js";

const migrationsDir = path.resolve(process.cwd(), "src", "migrations");

async function runMigrations() {
  logger.info(`Looking for migrations in ${migrationsDir}`);

  // 1. Ensure migrations table exists
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      run_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 2. Get already executed migrations
  const executed = await query<{ name: string }>(
    `SELECT name FROM migrations`
  );

  const executedNames = new Set(executed.rows.map((row) => row.name));

  // 3. Read all migration files
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    // 4. Skip if already executed
    if (executedNames.has(file)) {
      logger.info(`Skipping ${file} (already executed)`);
      continue;
    }

    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, "utf8");

    logger.info(`Running migration: ${file}`);

    try {
      // 5. Run migration
      await query(sql);

      // 6. Save it as executed
      await query(
        `INSERT INTO migrations (name) VALUES ($1)`,
        [file]
      );

      logger.info(`Finished migration: ${file}`);
    } catch (err) {
      logger.error(`Failed migration: ${file}`);
      throw err; // stop everything
    }
  }
}

runMigrations()
  .then(() => {
    logger.info("All migrations run successfully");
    process.exit(0);
  })
  .catch((err) => {
    logger.error(`Migration failed ${(err as Error).message}`);
    process.exit(1);
  });