import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ServiceIcon } from "./ServiceIcon";
import { KeyRow } from "./KeyRow";
import type { ApiKey } from "@/types";

interface ServiceGroupProps {
  service: string;
  keys: ApiKey[];
  onCopy: (key: ApiKey) => void;
  onToggleFavourite: (keyId: string) => void;
  onKeyClick: (key: ApiKey) => void;
}

export function ServiceGroup({
  service,
  keys,
  onCopy,
  onToggleFavourite,
  onKeyClick,
}: ServiceGroupProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="animate-fade-in">
      {/* Group header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-lockbox-surface/50 transition-colors"
      >
        <ServiceIcon service={service} size={20} />

        <span className="text-xs font-semibold text-lockbox-text-secondary uppercase tracking-wider flex-1 text-left truncate">
          {service}
        </span>

        {/* Key count badge */}
        <span className="px-1.5 py-0.5 text-[10px] font-medium text-lockbox-text-muted bg-lockbox-surface rounded-full min-w-[20px] text-center">
          {keys.length}
        </span>

        {/* Chevron */}
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-lockbox-text-muted shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-lockbox-text-muted shrink-0" />
        )}
      </button>

      {/* Key rows */}
      {expanded && (
        <div>
          {keys.map((key) => (
            <KeyRow
              key={key.id}
              apiKey={key}
              onCopy={onCopy}
              onToggleFavourite={onToggleFavourite}
              onClick={onKeyClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
