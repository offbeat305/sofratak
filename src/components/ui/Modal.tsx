"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  dir?: "ltr" | "rtl";
};

export function Modal({
  open,
  onClose,
  title,
  closeLabel = "Close",
  children,
  footer,
  className,
  dir,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      dir={dir}
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="animate-fade-in absolute inset-0 bg-charcoal/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          "animate-rise-in relative w-full max-w-lg rounded-modal border border-olive/10 bg-ivory p-6 shadow-[0_24px_60px_rgba(31,31,31,0.25)] sm:p-8",
          className,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-olive">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="rounded-full p-1.5 text-stone transition-colors hover:bg-olive/5 hover:text-olive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="text-[15px] leading-relaxed text-charcoal">
          {children}
        </div>
        {footer && (
          <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
