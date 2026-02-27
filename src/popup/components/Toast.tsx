import React, { useEffect } from "react";
import { Check } from "lucide-react";

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export function Toast({ message, visible, onHide, duration = 2000 }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onHide, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide, duration]);

  if (!visible) return null;

  return (
    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-lockbox-accent text-lockbox-bg text-xs font-medium rounded-lg shadow-lg">
        <Check className="w-3 h-3" />
        {message}
      </div>
    </div>
  );
}
