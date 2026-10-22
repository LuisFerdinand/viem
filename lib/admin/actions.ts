"use server";

import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { endAdminSession, isAdmin, passwordMatches, startAdminSession } from "./auth";
import { DOCUMENT_KEYS, deleteSetting, readSetting, settingKey, writeSetting } from "../settings";
import { parseYouTubeId, youTubeWatchUrl } from "../youtube";

export type AdminResult = { ok: true; message: string } | { ok: false; error: string };

const UNAUTHORISED: AdminResult = { ok: false, error: "Your session has expired. Please sign in again." };
const DB_ERROR: AdminResult = {
  ok: false,
  error: "Could not save. Check DATABASE_URL and that `npm run db:migrate` has been run.",
};

/** Public pages that show admin-managed content. */
function refreshSite() {
  revalidatePath("/", "layout");
}

/** Only ever delete files that live in our own Blob store. */
async function removeBlob(url: unknown) {
  if (typeof url !== "string" || !/^https:\/\/[\w-]+\.public\.blob\.vercel-storage\.com\//.test(url)) return;
  try {
    await del(url);
  } catch (err) {
    console.error("Could not delete old blob", err);
  }
}

export async function loginAction(_prev: AdminResult | null, formData: FormData): Promise<AdminResult> {
  const attempt = String(formData.get("password") ?? "");
  // A short pause makes password guessing impractical without a rate-limit store.
  await new Promise((r) => setTimeout(r, 600));
  if (!passwordMatches(attempt)) return { ok: false, error: "Incorrect password." };
  await startAdminSession();
  return { ok: true, message: "Signed in." };
}

export async function logoutAction() {
  await endAdminSession();
  revalidatePath("/admin");
}

const pdfInput = z.object({
  key: z.enum(DOCUMENT_KEYS),
  url: z
    .url()
    .refine((u) => /^https:\/\/[\w-]+\.public\.blob\.vercel-storage\.com\/.+\.pdf$/i.test(u), "Not an uploaded PDF."),
  name: z.string().trim().min(1).max(160),
  size: z.number().int().positive().max(60_000_000),
});

/** Called once the browser has finished uploading a PDF straight to Blob storage. */
export async function saveDocumentAction(input: z.input<typeof pdfInput>): Promise<AdminResult> {
  if (!(await isAdmin())) return UNAUTHORISED;
  const parsed = pdfInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid file." };
  const { key, url, name, size } = parsed.data;

  try {
    const previous = await readSetting(settingKey.document(key));
    await writeSetting(settingKey.document(key), { url, name, size });
    if (previous?.url !== url) await removeBlob(previous?.url);
  } catch (err) {
    console.error(err);
    return DB_ERROR;
  }
  refreshSite();
  return { ok: true, message: "PDF published. Visitors now see the new file." };
}

export async function resetDocumentAction(key: string): Promise<AdminResult> {
  if (!(await isAdmin())) return UNAUTHORISED;
  const parsed = z.enum(DOCUMENT_KEYS).safeParse(key);
  if (!parsed.success) return { ok: false, error: "Unknown document." };

  try {
    const previous = await readSetting(settingKey.document(parsed.data));
    await deleteSetting(settingKey.document(parsed.data));
    await removeBlob(previous?.url);
  } catch (err) {
    console.error(err);
    return DB_ERROR;
  }
  refreshSite();
  return { ok: true, message: "Back to the file bundled with the website." };
}

export async function saveVideoAction(_prev: AdminResult | null, formData: FormData): Promise<AdminResult> {
  if (!(await isAdmin())) return UNAUTHORISED;
  const link = String(formData.get("url") ?? "").trim();

  try {
    if (!link) {
      await deleteSetting(settingKey.introVideo);
      refreshSite();
      return { ok: true, message: "Video removed from the home page." };
    }
    const id = parseYouTubeId(link);
    if (!id) return { ok: false, error: "That doesn't look like a YouTube link. Paste the video's share or address-bar link." };
    await writeSetting(settingKey.introVideo, { url: youTubeWatchUrl(id) });
  } catch (err) {
    console.error(err);
    return DB_ERROR;
  }
  refreshSite();
  return { ok: true, message: "Video saved. It now shows on the home page." };
}
