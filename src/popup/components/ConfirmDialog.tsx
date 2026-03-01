import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "default";
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus the confirm button on mount for keyboard accessibility
    confirmRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative w-[320px] bg-lockbox-surface border border-lockbox-border rounded-xl shadow-2xl p-5 animate-scale-in mx-4">
        <h2
          id="confirm-dialog-title"
          className="text-sm font-semibold text-lockbox-text mb-1.5"
        >
          {title}
        </h2>
        <p className="text-xs text-lockbox-text-secondary leading-relaxed mb-5">
          {message}
        </p>

        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-lockbox-text-secondary rounded-lg border border-lockbox-border hover:bg-lockbox-border/50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
              variant === "danger"
                ? "bg-lockbox-danger text-white hover:bg-red-600"
                : "bg-lockbox-accent text-lockbox-bg hover:bg-lockbox-accent-hover",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
