/** Pulls the 11-character video id out of any common YouTube link (or a bare id). */
export function parseYouTubeId(input: string | null | undefined): string | null {
  const raw = input?.trim();
  if (!raw) return null;
  if (/^[\w-]{11}$/.test(raw)) return raw;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www|m|music)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const [, kind, value] = url.pathname.split("/");
      if (kind && ["embed", "shorts", "live", "v"].includes(kind)) id = value ?? null;
    }
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null;
}

export const youTubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
