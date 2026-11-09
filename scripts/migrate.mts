// Creates (or updates) the login tables in the Neon database.
// Run with: npm run db:migrate
import { getMigrations } from "better-auth/db/migration";
import { auth } from "../lib/auth.ts";

const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(auth.options);

if (toBeCreated.length === 0 && toBeAdded.length === 0) {
  console.log("Database is already up to date.");
} else {
  console.log("Creating tables:", toBeCreated.map((t) => t.table).join(", ") || "none");
  console.log("Adding columns to:", toBeAdded.map((t) => t.table).join(", ") || "none");
  await runMigrations();
  console.log("Done.");
}

process.exit(0);
