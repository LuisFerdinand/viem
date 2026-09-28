import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

async function main() {
  const { neon } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-http");
  const { migrate } = await import("drizzle-orm/neon-http/migrator");

  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing from .env.local");
  const db = drizzle(neon(process.env.DATABASE_URL));
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✓ Migrations applied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
