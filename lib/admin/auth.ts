import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Single-password admin login. The password lives in ADMIN_PASSWORD; a signed,
 * HttpOnly cookie proves a browser has entered it. Every admin page, server
 * action and API route re-checks the cookie — nothing relies on the UI alone.
 */

const COOKIE = "viem_admin";
const MAX_AGE = 60 * 60 * 24 * 7; // one week

const password = () => process.env.ADMIN_PASSWORD ?? "";
const secret = () => process.env.ADMIN_SESSION_SECRET || password();

export const isAdminConfigured = () => password().length >= 8;

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

function safeEqual(a: string, b: string) {
  const x = createHmac("sha256", "cmp").update(a).digest();
  const y = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(x, y);
}

export const passwordMatches = (attempt: string) => isAdminConfigured() && safeEqual(attempt, password());

export async function startAdminSession() {
  const expires = Date.now() + MAX_AGE * 1000;
  const payload = String(expires);
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;
  return Number(payload) > Date.now();
}
