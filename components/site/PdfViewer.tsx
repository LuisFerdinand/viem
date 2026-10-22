"use client";

import { ExternalLink, X } from "lucide-react";
import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import type { DocumentKey, SiteDocument } from "@/lib/settings";

// pdf.js is large, so it is only fetched the first time a document is opened.
const PdfReader = dynamic(() => import("./PdfReader"), {
  ssr: false,
  loading: () => <div role="status" className="flex h-full items-center justify-center text-sm text-forest-700">Loading viewer…</div>,
});

type Documents = Record<DocumentKey, SiteDocument>;
type Ctx = { documents: Documents; open: (key: DocumentKey) => void };

const ViewerContext = createContext<Ctx | null>(null);

export function useDocuments() {
  const ctx = useContext(ViewerContext);
  if (!ctx) throw new Error("useDocuments must be used inside <PdfViewerProvider>");
  return ctx;
}

/** Wraps the public site: shares the current PDFs and renders the single viewer modal. */
export function PdfViewerProvider({ documents, children }: { documents: Documents; children: React.ReactNode }) {
  const [openKey, setOpenKey] = useState<DocumentKey | null>(null);
  const open = useCallback((key: DocumentKey) => setOpenKey(key), []);
  const value = useMemo(() => ({ documents, open }), [documents, open]);

  return (
    <ViewerContext.Provider value={value}>
      {children}
      {openKey && <PdfModal doc={documents[openKey]} onClose={() => setOpenKey(null)} />}
    </ViewerContext.Provider>
  );
}

type ViewButtonProps = {
  docKey: DocumentKey;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  /** Runs when the viewer opens, e.g. to close a mobile menu. */
  onOpen?: () => void;
  children: React.ReactNode;
};

/** A button that opens a PDF in the on-site viewer instead of downloading it. */
export function ViewPdfButton({ docKey, onOpen, children, ...props }: ViewButtonProps) {
  const { open } = useDocuments();
  return (
    <Button
      {...props}
      aria-haspopup="dialog"
      onClick={() => {
        onOpen?.();
        open(docKey);
      }}
    >
      {children}
    </Button>
  );
}

/** Same, styled as an inline text link. */
export function ViewPdfLink({ docKey, className, children, ...props }: { docKey: DocumentKey } & ComponentProps<"button">) {
  const { open } = useDocuments();
  return (
    <button type="button" aria-haspopup="dialog" className={className} {...props} onClick={() => open(docKey)}>
      {children}
    </button>
  );
}

function PdfModal({ doc, onClose }: { doc: SiteDocument; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="pdf-modal-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto h-dvh max-h-none w-screen max-w-none overflow-hidden bg-white p-0 text-forest-900 shadow-lift backdrop:bg-forest-950/70 backdrop:backdrop-blur-sm sm:h-[92dvh] sm:w-[min(72rem,94vw)] sm:rounded-3xl"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-forest-100 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 id="pdf-modal-title" className="truncate font-display text-xl font-medium sm:text-2xl">
              {doc.title}
            </h2>
            <p className="text-xs text-muted">{doc.meta}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <a
              href={doc.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-forest-700 hover:bg-forest-50"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">New tab</span>
              <span className="sr-only sm:hidden">Open in new tab</span>
            </a>
            <button
              type="button"
              autoFocus
              onClick={() => ref.current?.close()}
              aria-label="Close document"
              className="flex size-10 items-center justify-center rounded-full text-forest-900 hover:bg-forest-100"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1">
          <PdfReader url={doc.href} fileName={doc.fileName} />
        </div>
      </div>
    </dialog>
  );
}
