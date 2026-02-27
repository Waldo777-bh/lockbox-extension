import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { KeyRow } from "./KeyRow";
import type { VaultWithKeys } from "../../types";

interface VaultGroupProps {
  vault: VaultWithKeys;
  selectedKeyId?: string | null;
  onCopy?: () => void;
  defaultExpanded?: boolean;
}

export function VaultGroup({
  vault,
  selectedKeyId,
  onCopy,
  defaultExpanded = true,
}: VaultGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="animate-fade-in">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-lockbox-text-muted hover:text-lockbox-text-secondary transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <span className="uppercase tracking-wider">{vault.name}</span>
        <span className="text-lockbox-text-muted/60 ml-auto">
          {vault.keys.length}
        </span>
      </button>

      {expanded && (
        <div>
          {vault.keys.map((key) => (
            <KeyRow
              key={key.id}
              apiKey={key}
              isSelected={key.id === selectedKeyId}
              onCopy={onCopy}
            />
          ))}
        </div>
      )}
    </div>
  );
}
