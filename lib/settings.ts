import { cache } from "react";
import { eq } from "drizzle-orm";
import { DOWNLOADS } from "./content";
import { db } from "./db/client";
import { siteSettings } from "./db/schema";
import { parseYouTubeId } from "./youtube";

/** The two PDFs the site offers. Each can be replaced from the admin panel. */
export const DOCUMENT_KEYS = ["proposal", "profile"] as const;
export type DocumentKey = (typeof DOCUMENT_KEYS)[number];

export type SiteDocument = {
  key: DocumentKey;
  /** Where the PDF is served from: an uploaded blob, or the bundled fallback. */
  href: string;
  /** Download name, also shown in the viewer header. */
  fileName: string;
  title: string;
  description: string;
  /** Short caption such as "PDF · 14.6 MB". */
  meta: string;
  /** True when an admin upload replaced the bundled file. */
  custom: boolean;
};

export type SiteContent = {
  documents: Record<DocumentKey, SiteDocument>;
  /** YouTube video id of the company introduction, or null when none is set. */
  introVideoId: string | null;
};

type StoredDocument = { url: string; name: string; size: number };
type StoredVideo = { url: string };

export const settingKey = {
  document: (key: DocumentKey) => `document:${key}`,
  introVideo: "intro-video",
} as const;

const BUNDLED_SIZE: Record<DocumentKey, number> = {
  proposal: 14_578_112,
  profile: 11_616_197,
};

const formatSize = (bytes: number) => `${(bytes / 1_000_000).toFixed(1)} MB`;

function bundled(key: DocumentKey): SiteDocument {
  const d = DOWNLOADS[key];
  return {
    key,
    href: d.href,
    fileName: d.href.split("/").pop() ?? `${key}.pdf`,
    title: d.title,
    description: d.description,
    meta: `PDF · ${formatSize(BUNDLED_SIZE[key])}`,
    custom: false,
  };
}

const isStoredDocument = (v: unknown): v is StoredDocument =>
  !!v && typeof v === "object" && typeof (v as StoredDocument).url === "string" && (v as StoredDocument).url.startsWith("https://");

/**
 * Reads the admin-managed content. Always resolves: with no database, a missing
 * table or nothing saved yet, the bundled PDFs are used and no video is shown.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const content: SiteContent = {
    documents: { proposal: bundled("proposal"), profile: bundled("profile") },
    introVideoId: null,
  };
  if (!db) return content;

  try {
    const rows = await db.select().from(siteSettings);
    for (const row of rows) {
      if (row.key === settingKey.introVideo) {
        content.introVideoId = parseYouTubeId((row.value as StoredVideo).url);
        continue;
      }
      for (const key of DOCUMENT_KEYS) {
        if (row.key !== settingKey.document(key) || !isStoredDocument(row.value)) continue;
        const base = bundled(key);
        content.documents[key] = {
          ...base,
          href: row.value.url,
          fileName: row.value.name || base.fileName,
          meta: `PDF · ${formatSize(row.value.size)}`,
          custom: true,
        };
      }
    }
  } catch (err) {
    // A warning, not an error: before `npm run db:migrate` the table is missing and defaults apply.
    console.warn("Could not read site settings; using defaults.", err instanceof Error ? err.message : err);
  }
  return content;
});

export async function readSetting(key: string) {
  if (!db) return null;
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
  return row?.value ?? null;
}

export async function writeSetting(key: string, value: Record<string, unknown>) {
  if (!db) throw new Error("DATABASE_URL is not configured.");
  await db
    .insert(siteSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date() } });
}

export async function deleteSetting(key: string) {
  if (!db) throw new Error("DATABASE_URL is not configured.");
  await db.delete(siteSettings).where(eq(siteSettings.key, key));
}
