"use client";

import Image, { type ImageLoader, type ImageProps } from "next/image";

const UNSPLASH = "https://images.unsplash.com/";

/**
 * Let Unsplash's CDN resize its own images instead of the Next.js optimizer.
 * Capped at 2400px: no layout here needs more, even on high-DPI screens.
 */
const unsplashLoader: ImageLoader = ({ src, width, quality }) =>
  `${src}${src.includes("?") ? "&" : "?"}w=${Math.min(width, 2400)}&q=${quality ?? 75}`;

/**
 * next/image with a smart default: Unsplash URLs use the Unsplash loader,
 * everything else (local static imports) goes through the built-in optimizer.
 */
export function Photo({ alt, ...props }: ImageProps) {
  const isUnsplash = typeof props.src === "string" && props.src.startsWith(UNSPLASH);
  return <Image {...props} alt={alt} loader={isUnsplash ? unsplashLoader : props.loader} />;
}
