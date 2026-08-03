"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

export function Modal({ open, onClose, title, description, children }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode }) {
  const titleId = useId(); const descriptionId = useId(); const dialogRef = useRef<HTMLDivElement>(null); const previousFocus = useRef<HTMLElement | null>(null); const onCloseRef = useRef(onClose); onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    const focusDialog = window.requestAnimationFrame(() => dialogRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { onCloseRef.current(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\")]"));
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { window.cancelAnimationFrame(focusDialog); document.removeEventListener("keydown", onKeyDown); previousFocus.current?.focus(); };
  }, [open]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[300] flex items-end justify-center bg-[#242424]/40 p-0 sm:items-center sm:p-6" role="presentation"><button type="button" className="absolute inset-0 cursor-default" tabIndex={-1} aria-label="ปิดหน้าต่าง" onClick={onClose} /><div ref={dialogRef} tabIndex={-1} className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-lg bg-white shadow-soft focus:outline-none sm:max-w-xl sm:rounded-md" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}><div className="flex items-start justify-between border-b border-line px-5 py-4"><div><h2 id={titleId} className="text-lg font-semibold">{title}</h2>{description ? <p id={descriptionId} className="mt-1 text-sm text-muted">{description}</p> : null}</div><button type="button" className="focus-ring rounded-sm p-2 text-muted hover:bg-[#f3f3f7]" aria-label="ปิดหน้าต่าง" onClick={onClose}><X size={18} aria-hidden="true" /></button></div><div className="p-5">{children}</div></div></div>;
}