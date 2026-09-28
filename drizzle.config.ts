import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local", quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add your Neon connection string to .env.local");
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
  strict: true,
  verbose: true,
});
