"use client";

import { Play } from "lucide-react";
import { useState } from "react";

/**
 * Click-to-play YouTube embed. Nothing from YouTube loads until the visitor presses play,
 * which keeps the home page fast on slow connections and avoids tracking cookies up front.
 * The poster is the video's own YouTube thumbnail, so a custom thumbnail set in YouTube
 * Studio appears here automatically.
 */
export function IntroVideo({ videoId, title }: { videoId: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const [poster, setPoster] = useState<"maxresdefault" | "hqdefault">("maxresdefault");

  return (
    <div className="relative aspect-video overflow-hidden rounded-3xl bg-forest-900 shadow-lift ring-1 ring-white/15">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play video: ${title}`}
          className="group absolute inset-0 size-full cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- YouTube-hosted poster, loaded lazily */}
          <img
            src={`https://i.ytimg.com/vi/${videoId}/${poster}.jpg`}
            alt=""
            loading="lazy"
            onLoad={(e) => {
              // YouTube answers 200 with a tiny grey placeholder when no max-res poster exists.
              if (poster === "maxresdefault" && e.currentTarget.naturalWidth <= 120) setPoster("hqdefault");
            }}
            onError={() => setPoster("hqdefault")}
            className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-forest-950/60 via-transparent to-forest-950/10" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="relative flex size-20 items-center justify-center rounded-full bg-leaf-400 text-forest-950 shadow-lift transition-transform duration-300 group-hover:scale-110 sm:size-24">
              <span aria-hidden="true" className="absolute inset-0 rounded-full bg-leaf-400/50 motion-safe:animate-ping" />
              <Play className="relative size-8 translate-x-0.5 fill-current sm:size-9" aria-hidden="true" />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
