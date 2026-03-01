import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

const TOAST_CONFIG: Record<
  ToastType,
  { icon: React.ReactNode; bg: string; border: string; text: string }
> = {
  success: {
    icon: <Check className="w-3.5 h-3.5" />,
    bg: "bg-lockbox-success/10",
    border: "border-lockbox-success/30",
    text: "text-lockbox-success",
  },
  error: {
    icon: <AlertCircle className="w-3.5 h-3.5" />,
    bg: "bg-lockbox-danger/10",
    border: "border-lockbox-danger/30",
    text: "text-lockbox-danger",
  },
  info: {
    icon: <Info className="w-3.5 h-3.5" />,
    bg: "bg-lockbox-accent/10",
    border: "border-lockbox-accent/30",
    text: "text-lockbox-accent",
  },
};

export function Toast({ message, type = "success", onClose }: ToastProps) {
  const config = TOAST_CONFIG[type];

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50"
      >
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg backdrop-blur-sm",
            config.bg,
            config.border,
          )}
        >
          <span className={config.text}>{config.icon}</span>
          <span className="text-xs font-medium text-lockbox-text">
            {message}
          </span>
          <button
            onClick={onClose}
            className="p-0.5 rounded hover:bg-lockbox-border/50 text-lockbox-text-muted transition-colors ml-1"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
