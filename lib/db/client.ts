import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Drizzle over Neon's HTTP driver — one stateless HTTPS request per query,
 * which suits serverless route handlers and server actions.
 * `db` is null when DATABASE_URL is not configured so the demo can fall back
 * to in-memory data instead of crashing.
 */
const url = process.env.DATABASE_URL;

export const db = url ? drizzle(neon(url), { schema }) : null;
export type Database = NonNullable<typeof db>;
