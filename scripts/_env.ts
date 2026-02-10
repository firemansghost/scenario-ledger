/**
 * Load .env.local first (if present), then .env. Use in all scripts so env is reliable.
 * Usage: import "./_env" at top of seed.ts, backfill-daily.ts, backfill-weekly.ts
 */
import path from "path";
import dotenv from "dotenv";

const cwd = process.cwd();
dotenv.config({ path: path.resolve(cwd, ".env.local") });
dotenv.config({ path: path.resolve(cwd, ".env") });
