"use client";

import { CheckCircle2, Loader2, Save, Video } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { saveVideoAction, type AdminResult } from "@/lib/admin/actions";
import { parseYouTubeId } from "@/lib/youtube";

export function VideoForm({ initialUrl }: { initialUrl: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [state, action, pending] = useActionState<AdminResult | null, FormData>(saveVideoAction, null);
  const id = parseYouTubeId(url);

  return (
    <section className="rounded-3xl border border-forest-100 bg-white p-6 shadow-soft md:p-8">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-forest-800 text-leaf-300">
          <Video className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-2xl font-medium text-forest-900">Company introduction video</h2>
          <p className="mt-1 text-sm text-muted">
            Paste a YouTube link. It appears on the home page, right under the headline numbers. Leave empty to hide the section.
          </p>
        </div>
      </div>

      <form action={action} className="mt-6">
        <label htmlFor="video-url" className="block text-sm font-medium text-forest-900">
          YouTube link
        </label>
        <input
          id="video-url"
          name="url"
          type="text"
          inputMode="url"
          placeholder="https://www.youtube.com/watch?v=…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-forest-200 bg-white px-4 text-base outline-none focus:border-forest-500 focus:ring-2 focus:ring-leaf-300"
        />

        {url.trim() && !id && <p className="mt-2 text-sm text-warn-700">This doesn&apos;t look like a YouTube link yet.</p>}

        {id && (
          <div className="mt-5 overflow-hidden rounded-2xl bg-forest-950 ring-1 ring-forest-100">
            <div className="relative aspect-video">
              <iframe
                key={id}
                src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
                title="Video preview"
                loading="lazy"
                allow="encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 size-full"
              />
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending || (!url.trim() && !initialUrl)}>
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            {url.trim() || !initialUrl ? "Save video" : "Remove video"}
          </Button>
          {state && (
            <p
              role={state.ok ? "status" : "alert"}
              className={`flex items-center gap-2 text-sm font-medium ${state.ok ? "text-ok-700" : "text-crit-700"}`}
            >
              {state.ok && <CheckCircle2 className="size-4" aria-hidden="true" />}
              {state.ok ? state.message : state.error}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
