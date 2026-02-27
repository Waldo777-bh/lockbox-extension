import React, { useState, useCallback } from "react";
import { Copy, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { addRecentKey } from "../../lib/cache";
import { REVEAL_DURATION_MS, COPY_FEEDBACK_MS } from "../../lib/constants";
import type { ApiKey } from "../../types";
import { getServiceIcon } from "../../types";

interface KeyRowProps {
  apiKey: ApiKey;
  isSelected?: boolean;
  onCopy?: () => void;
}

export function KeyRow({ apiKey, isSelected, onCopy }: KeyRowProps) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [revealedValue, setRevealedValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const serviceIcon = getServiceIcon(apiKey.service);

  const handleCopy = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.revealKey(apiKey.vaultId, apiKey.id);
      await navigator.clipboard.writeText(result.value);
      await addRecentKey(apiKey.id, apiKey.vaultId);

      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
      onCopy?.();
    } catch (err) {
      console.error("Failed to copy key:", err);
    } finally {
      setLoading(false);
    }
  }, [apiKey.id, apiKey.vaultId, onCopy]);

  const handleReveal = useCallback(async () => {
    if (revealed) {
      setRevealed(false);
      setRevealedValue(null);
      return;
    }

    try {
      setLoading(true);
      const result = await api.revealKey(apiKey.vaultId, apiKey.id);
      setRevealedValue(result.value);
      setRevealed(true);

      setTimeout(() => {
        setRevealed(false);
        setRevealedValue(null);
      }, REVEAL_DURATION_MS);
    } catch (err) {
      console.error("Failed to reveal key:", err);
    } finally {
      setLoading(false);
    }
  }, [apiKey.id, apiKey.vaultId, revealed]);

  const isExpiringSoon =
    apiKey.expiresAt &&
    new Date(apiKey.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return (
    <div
      className={`group flex items-center gap-2.5 px-3 py-2 hover:bg-lockbox-surface/80 cursor-pointer transition-colors ${
        isSelected ? "bg-lockbox-surface" : ""
      }`}
      onClick={handleCopy}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleCopy();
      }}
    >
      {/* Service icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
        style={{ backgroundColor: `${serviceIcon.color}20`, color: serviceIcon.color }}
      >
        {serviceIcon.letter}
      </div>

      {/* Key info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-lockbox-text truncate">
            {apiKey.name}
          </span>
          {isExpiringSoon && (
            <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-medium bg-lockbox-warning/10 text-lockbox-warning rounded">
              Expiring
            </span>
          )}
        </div>
        <div className="text-xs text-lockbox-text-muted truncate">
          {revealed && revealedValue ? (
            <span className="font-mono text-lockbox-accent text-[11px]">
              {revealedValue}
            </span>
          ) : (
            <span>{apiKey.service} &middot; {apiKey.maskedValue}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 text-lockbox-text-muted animate-spin" />
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleReveal();
              }}
              className="p-1 rounded hover:bg-lockbox-border transition-colors"
              title={revealed ? "Hide" : "Reveal"}
            >
              {revealed ? (
                <EyeOff className="w-3.5 h-3.5 text-lockbox-accent" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-lockbox-text-muted" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              className="p-1 rounded hover:bg-lockbox-border transition-colors"
              title="Copy"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-lockbox-accent" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-lockbox-text-muted" />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
