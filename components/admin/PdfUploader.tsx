"use client";

import { upload } from "@vercel/blob/client";
import { CheckCircle2, ExternalLink, FileText, Loader2, RotateCcw, UploadCloud } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { resetDocumentAction, saveDocumentAction } from "@/lib/admin/actions";
import type { DocumentKey } from "@/lib/settings";

const MAX_BYTES = 50 * 1024 * 1024;

type Props = {
  docKey: DocumentKey;
  title: string;
  hint: string;
  current: { href: string; fileName: string; meta: string; custom: boolean };
  /** False when BLOB_READ_WRITE_TOKEN is missing, so uploads cannot work yet. */
  uploadsReady: boolean;
};

type Status = { kind: "idle" } | { kind: "ok" | "error"; text: string };

export function PdfUploader({ docKey, title, hint, current, uploadsReady }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [resetting, startReset] = useTransition();
  const busy = progress !== null;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setStatus({ kind: "idle" });
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
      return setStatus({ kind: "error", text: "Please choose a PDF file." });
    }
    if (file.size > MAX_BYTES) {
      return setStatus({ kind: "error", text: "That file is over 50 MB. Compress it and try again." });
    }

    setProgress(0);
    try {
      const safeName = file.name.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-");
      const blob = await upload(`documents/${docKey}-${safeName}`, file, {
        access: "public",
        contentType: "application/pdf",
        handleUploadUrl: "/api/admin/upload",
        multipart: file.size > 8 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });
      const result = await saveDocumentAction({ key: docKey, url: blob.url, name: file.name, size: file.size });
      setStatus(result.ok ? { kind: "ok", text: result.message } : { kind: "error", text: result.error });
    } catch (err) {
      setStatus({ kind: "error", text: err instanceof Error ? err.message : "Upload failed. Please try again." });
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function reset() {
    if (!confirm("Go back to the PDF bundled with the website? The uploaded file will be deleted.")) return;
    startReset(async () => {
      const result = await resetDocumentAction(docKey);
      setStatus(result.ok ? { kind: "ok", text: result.message } : { kind: "error", text: result.error });
    });
  }

  return (
    <section className="rounded-3xl border border-forest-100 bg-white p-6 shadow-soft md:p-8">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-forest-800 text-leaf-300">
          <FileText className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-medium text-forest-900">{title}</h2>
          <p className="mt-1 text-sm text-muted">{hint}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-forest-50 px-4 py-3 text-sm">
        <div className="min-w-0">
          <p className="truncate font-medium text-forest-900">{current.fileName}</p>
          <p className="text-xs text-muted">
            {current.meta} · {current.custom ? "uploaded from this panel" : "bundled with the website"}
          </p>
        </div>
        <a
          href={current.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-forest-600 hover:underline"
        >
          Open <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        id={`file-${docKey}`}
        disabled={busy || !uploadsReady}
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <label
          htmlFor={`file-${docKey}`}
          aria-disabled={busy || !uploadsReady}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-forest-700 px-5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-forest-800 aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <UploadCloud className="size-4" aria-hidden="true" />}
          {busy ? `Uploading ${progress}%` : "Upload new PDF"}
        </label>
        {current.custom && (
          <Button variant="ghost" onClick={reset} disabled={busy || resetting}>
            <RotateCcw className="size-4" aria-hidden="true" /> Use bundled file
          </Button>
        )}
      </div>

      {busy && (
        <div aria-hidden="true" className="mt-4 h-2 overflow-hidden rounded-full bg-forest-100">
          <div className="h-full rounded-full bg-gradient-to-r from-forest-500 to-leaf-400 transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      )}

      {!uploadsReady && (
        <p className="mt-4 text-sm text-warn-700">
          Uploads are switched off until Blob storage is connected (see the setup steps above).
        </p>
      )}
      {status.kind !== "idle" && (
        <p
          role={status.kind === "error" ? "alert" : "status"}
          className={`mt-4 flex items-start gap-2 text-sm font-medium ${status.kind === "error" ? "text-crit-700" : "text-ok-700"}`}
        >
          {status.kind === "ok" && <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
          {status.text}
        </p>
      )}
    </section>
  );
}
