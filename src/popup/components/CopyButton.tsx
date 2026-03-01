import React, { useState, useCallback } from "react";
import { ClipboardCopy, Check } from "lucide-react";
import { COPY_FEEDBACK_MS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  className?: string;
  onCopy?: () => void;
}

export function CopyButton({ value, className, onCopy }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        onCopy?.();
        setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    },
    [value, onCopy],
  );

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "p-1.5 rounded-md transition-colors",
        copied
          ? "text-lockbox-accent bg-lockbox-accent/10"
          : "text-lockbox-text-muted hover:text-lockbox-text hover:bg-lockbox-surface",
        className,
      )}
      title={copied ? "Copied!" : "Copy"}
      aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <ClipboardCopy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
