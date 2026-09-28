import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

async function main() {
  // Import after dotenv so the client sees DATABASE_URL.
  const { db } = await import("../lib/db/client");
  const { seedDatabase } = await import("../lib/db/seed");
  if (!db) throw new Error("DATABASE_URL is missing from .env.local");
  await seedDatabase(db);
  console.log("✓ Demo data seeded");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
