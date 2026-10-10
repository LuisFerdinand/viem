"use client";
import { cloneElement, useId, useRef, useState, type ReactElement } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "./LanguageProvider";

export function Tooltip({ label, enabled = true, children }: { label: string; enabled?: boolean; children: ReactElement<{ "aria-describedby"?: string }> }) {
  const { language } = useLanguage();
  const id = useId();
  const anchor = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const show = () => {
    if (!enabled || !anchor.current) return;
    const rect = anchor.current.getBoundingClientRect();
    setPosition({ left: rect.right + 12, top: Math.max(24, Math.min(innerHeight - 24, rect.top + rect.height / 2)) });
  };
  return <span ref={anchor} className="block" onMouseEnter={show} onMouseLeave={() => setPosition(null)} onFocus={show} onBlur={() => setPosition(null)} onKeyDown={(e) => { if (e.key === "Escape") setPosition(null); }}>
    {cloneElement(children, { "aria-describedby": enabled && position ? id : undefined })}
    {position && enabled && createPortal(<span id={id} lang={language} role="tooltip" className="pointer-events-none fixed z-[80] max-w-64 -translate-y-1/2 rounded-lg bg-forest-900 px-3 py-2 text-xs font-medium text-white shadow-lift" style={position}>{label}</span>, document.body)}
  </span>;
}
