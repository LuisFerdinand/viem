"use client";

import { Loader2, Minus, Plus } from "lucide-react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";

/**
 * Canvas-based PDF reader (pdf.js). Browsers' built-in PDF viewers don't work inside
 * an <iframe> on most phones, which is where much of VIEM's audience is, so pages are
 * drawn ourselves. Pages render lazily and are released when scrolled far away,
 * keeping memory low for large files.
 */

type PageSize = { w: number; h: number };

const MAX_PAGE_WIDTH = 960;
const GUTTER = 32;
const ZOOMS = [0.75, 1, 1.25, 1.5, 2, 2.5];

export default function PdfReader({ url, fileName }: { url: string; fileName: string }) {
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [sizes, setSizes] = useState<PageSize[]>([]);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(1);
  const [available, setAvailable] = useState(0);
  const [current, setCurrent] = useState(1);

  // Load the document.
  useEffect(() => {
    let cancelled = false;
    let task: { destroy: () => Promise<void> } | null = null;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const loading = pdfjs.getDocument({ url });
        task = loading;
        loading.onProgress = ({ loaded: got, total }: { loaded: number; total: number }) => {
          if (total && !cancelled) setProgress(Math.min(1, got / total));
        };
        const doc = await loading.promise;
        const pageSizes = await Promise.all(
          Array.from({ length: doc.numPages }, async (_, i) => {
            const view = (await doc.getPage(i + 1)).getViewport({ scale: 1 });
            return { w: view.width, h: view.height };
          }),
        );
        if (cancelled) return;
        setSizes(pageSizes);
        setPdf(doc);
      } catch (err) {
        console.error("PDF failed to load", err);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      void task?.destroy();
    };
  }, [url]);

  // Track the width we can draw into.
  useEffect(() => {
    if (!scroller) return;
    const ro = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    ro.observe(scroller);
    return () => ro.disconnect();
  }, [scroller]);

  // Keep the page counter in step with scrolling.
  useEffect(() => {
    if (!scroller || !pdf) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const probe = scroller.scrollTop + scroller.clientHeight / 3;
      let page = 1;
      scroller.querySelectorAll<HTMLElement>("[data-page]").forEach((el) => {
        if (el.offsetTop <= probe) page = Number(el.dataset.page);
      });
      setCurrent(page);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [scroller, pdf]);

  const zoom = ZOOMS[zoomIndex];
  const fit = Math.max(0, Math.min(MAX_PAGE_WIDTH, available - GUTTER));
  const pageWidth = Math.round(fit * zoom);

  if (failed) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="font-display text-2xl text-forest-900">We couldn&apos;t show this PDF here</p>
        <p className="max-w-sm text-sm text-muted">Your browser blocked the viewer. You can still read it in a new tab.</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-forest-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
        >
          Open {fileName}
        </a>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div
        ref={setScroller}
        tabIndex={0}
        aria-label={`${fileName}, scrollable document`}
        className="min-h-0 flex-1 overflow-auto overscroll-contain bg-forest-100 outline-none"
      >
        {pdf && pageWidth > 0 && (
          <div className="mx-auto flex w-max min-w-full flex-col items-center gap-4 px-4 py-4">
            {sizes.map((size, i) => (
              <PdfPage
                key={i}
                pdf={pdf}
                pageNumber={i + 1}
                width={pageWidth}
                height={Math.round((pageWidth * size.h) / size.w)}
                root={scroller}
              />
            ))}
          </div>
        )}
      </div>

      {!pdf && (
        <div role="status" className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-forest-700">
          <Loader2 className="size-8 animate-spin" aria-hidden="true" />
          <p className="text-sm font-medium">Loading document{progress > 0 ? ` · ${Math.round(progress * 100)}%` : "…"}</p>
        </div>
      )}

      {pdf && (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-forest-950/90 p-1 text-sm text-white shadow-lift backdrop-blur-md">
            <button
              type="button"
              onClick={() => setZoomIndex((i) => Math.max(0, i - 1))}
              disabled={zoomIndex === 0}
              aria-label="Zoom out"
              className="flex size-9 items-center justify-center rounded-full hover:bg-white/15 disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <span className="min-w-24 px-1 text-center font-medium tabular-nums" aria-live="polite">
              Page {current} / {pdf.numPages}
            </span>
            <button
              type="button"
              onClick={() => setZoomIndex((i) => Math.min(ZOOMS.length - 1, i + 1))}
              disabled={zoomIndex === ZOOMS.length - 1}
              aria-label="Zoom in"
              className="flex size-9 items-center justify-center rounded-full hover:bg-white/15 disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PdfPage({
  pdf,
  pageNumber,
  width,
  height,
  root,
}: {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  width: number;
  height: number;
  root: HTMLDivElement | null;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    if (!box || !root) return;
    const io = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      root,
      rootMargin: "120% 0px",
    });
    io.observe(box);
    return () => io.disconnect();
  }, [root]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!near) {
      // Free the bitmap for pages far from view.
      canvas.width = 0;
      canvas.height = 0;
      return;
    }

    let render: RenderTask | null = null;
    let cancelled = false;
    (async () => {
      const page = await pdf.getPage(pageNumber);
      if (cancelled) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: (width / base.width) * dpr });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      render = page.render({ canvas, viewport });
      await render.promise;
    })().catch((err) => {
      if (err?.name !== "RenderingCancelledException") console.error(`Page ${pageNumber} failed`, err);
    });

    return () => {
      cancelled = true;
      render?.cancel();
    };
  }, [pdf, pageNumber, width, near]);

  return (
    <div
      ref={boxRef}
      data-page={pageNumber}
      className="relative shrink-0 bg-white shadow-soft"
      style={{ width, height }}
    >
      <canvas ref={canvasRef} aria-label={`Page ${pageNumber}`} role="img" style={{ width, height }} className="block" />
    </div>
  );
}
