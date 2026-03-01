import React, { useState, useEffect, useCallback, useRef } from "react";
import { Eye, EyeOff } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { REVEAL_DURATION_MS } from "@/lib/constants";

interface KeyValueRevealProps {
  value: string;
  onCopy: () => void;
}

export function KeyValueReveal({ value, onCopy }: KeyValueRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleReveal = useCallback(() => {
    if (revealed) {
      setRevealed(false);
      clearTimer();
      return;
    }

    setRevealed(true);
    clearTimer();
    timerRef.current = setTimeout(() => {
      setRevealed(false);
    }, REVEAL_DURATION_MS);
  }, [revealed, clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return (
    <div className="flex items-center gap-2 bg-lockbox-surface border border-lockbox-border rounded-lg px-3 py-2">
      {/* Value display */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {revealed ? (
          <span
            className="text-xs font-mono text-lockbox-accent break-all animate-fade-in"
            style={{
              transition: "filter 0.3s ease",
            }}
          >
            {value}
          </span>
        ) : (
          <button
            onClick={handleReveal}
            className="flex items-center gap-1.5 text-xs text-lockbox-text-muted hover:text-lockbox-text-secondary transition-colors group"
          >
            <span className="font-mono tracking-wider select-none">
              &#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;
            </span>
            <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
              Click to reveal
            </span>
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleReveal}
          className="p-1.5 rounded-md text-lockbox-text-muted hover:text-lockbox-text hover:bg-lockbox-border/50 transition-colors"
          title={revealed ? "Hide value" : "Reveal value"}
          aria-label={revealed ? "Hide value" : "Reveal value"}
        >
          {revealed ? (
            <EyeOff className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
        </button>
        <CopyButton value={value} onCopy={onCopy} />
      </div>
    </div>
  );
}
