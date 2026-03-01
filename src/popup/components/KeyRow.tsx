import React, { useState, useCallback } from "react";
import { Star, Check, ClipboardCopy } from "lucide-react";
import { ServiceIcon } from "./ServiceIcon";
import { maskValue, cn } from "@/lib/utils";
import { COPY_FEEDBACK_MS } from "@/lib/constants";
import type { ApiKey } from "@/types";

interface KeyRowProps {
  apiKey: ApiKey;
  onCopy: (key: ApiKey) => void;
  onToggleFavourite: (keyId: string) => void;
  onClick: (key: ApiKey) => void;
}

export function KeyRow({
  apiKey,
  onCopy,
  onToggleFavourite,
  onClick,
}: KeyRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onCopy(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    },
    [apiKey, onCopy],
  );

  const handleFavourite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleFavourite(apiKey.id);
    },
    [apiKey.id, onToggleFavourite],
  );

  const handleClick = useCallback(() => {
    onClick(apiKey);
  }, [apiKey, onClick]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(apiKey);
      }
    },
    [apiKey, onClick],
  );

  return (
    <div
      className="group flex items-center gap-2.5 px-3 py-2 hover:bg-lockbox-surface/80 cursor-pointer transition-colors"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Service icon */}
      <ServiceIcon service={apiKey.service} size={32} />

      {/* Key info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-lockbox-text truncate">
            {apiKey.name}
          </span>
        </div>
        <div className="text-xs text-lockbox-text-muted truncate">
          <span>{apiKey.service}</span>
          <span className="mx-1">&middot;</span>
          <span className="font-mono text-[11px]">
            {maskValue(apiKey.value)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* Favourite toggle */}
        <button
          onClick={handleFavourite}
          className={cn(
            "p-1 rounded transition-colors",
            apiKey.favourite
              ? "text-lockbox-warning"
              : "text-lockbox-text-muted/40 opacity-0 group-hover:opacity-100 hover:text-lockbox-warning",
          )}
          title={apiKey.favourite ? "Remove from favourites" : "Add to favourites"}
          aria-label={apiKey.favourite ? "Remove from favourites" : "Add to favourites"}
        >
          <Star
            className="w-3.5 h-3.5"
            fill={apiKey.favourite ? "currentColor" : "none"}
          />
        </button>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={cn(
            "p-1 rounded transition-colors",
            copied
              ? "text-lockbox-accent"
              : "text-lockbox-text-muted opacity-0 group-hover:opacity-100 hover:text-lockbox-text",
          )}
          title={copied ? "Copied!" : "Copy value"}
          aria-label={copied ? "Copied to clipboard" : "Copy value to clipboard"}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <ClipboardCopy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
