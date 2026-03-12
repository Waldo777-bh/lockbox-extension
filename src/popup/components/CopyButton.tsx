import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardCopy, Check } from "lucide-react";
import { COPY_FEEDBACK_MS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  className?: string;
  onCopy?: () => void;
}

/**
 * N1: Enhanced CopyButton with micro-animations.
 * - Scale-down pulse on click
 * - Icon cross-fades between clipboard and check
 * - Ripple ring on success
 */
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
    <motion.button
      onClick={handleCopy}
      whileTap={{ scale: 0.85 }}
      className={cn(
        "relative p-1.5 rounded-md transition-colors",
        copied
          ? "text-lockbox-accent bg-lockbox-accent/10"
          : "text-lockbox-text-muted hover:text-lockbox-text hover:bg-lockbox-surface",
        className,
      )}
      title={copied ? "Copied!" : "Copy"}
      aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
    >
      {/* Success ripple ring */}
      <AnimatePresence>
        {copied && (
          <motion.span
            className="absolute inset-0 rounded-md border-2 border-lockbox-accent"
            initial={{ opacity: 0.6, scale: 0.8 }}
            animate={{ opacity: 0, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>

      {/* Icon cross-fade */}
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Check className="w-3.5 h-3.5" />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
          >
            <ClipboardCopy className="w-3.5 h-3.5" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
