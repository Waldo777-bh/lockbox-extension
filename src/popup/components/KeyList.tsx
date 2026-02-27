import React from "react";
import { KeyRound } from "lucide-react";
import { VaultGroup } from "./VaultGroup";
import type { VaultWithKeys } from "../../types";

interface KeyListProps {
  vaults: VaultWithKeys[];
  loading: boolean;
  selectedKeyId?: string | null;
  onCopy?: () => void;
}

function LoadingSkeleton() {
  return (
    <div className="px-3 py-2 space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-lockbox-surface" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-24 bg-lockbox-surface rounded" />
            <div className="h-2.5 w-36 bg-lockbox-surface rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-fade-in">
      <div className="w-12 h-12 rounded-xl bg-lockbox-surface border border-lockbox-border flex items-center justify-center mb-3">
        <KeyRound className="w-5 h-5 text-lockbox-text-muted" />
      </div>
      <p className="text-sm text-lockbox-text-secondary mb-1">No keys yet</p>
      <p className="text-xs text-lockbox-text-muted">
        Open Dashboard to add your first key.
      </p>
    </div>
  );
}

function NoResults() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-6 text-center animate-fade-in">
      <p className="text-sm text-lockbox-text-secondary">No matching keys</p>
      <p className="text-xs text-lockbox-text-muted mt-1">
        Try a different search term
      </p>
    </div>
  );
}

export function KeyList({ vaults, loading, selectedKeyId, onCopy }: KeyListProps) {
  if (loading) return <LoadingSkeleton />;

  const totalKeys = vaults.reduce((sum, v) => sum + v.keys.length, 0);

  if (totalKeys === 0 && vaults.length === 0) return <EmptyState />;
  if (totalKeys === 0) return <NoResults />;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      {vaults.map((vault) => (
        <VaultGroup
          key={vault.id}
          vault={vault}
          selectedKeyId={selectedKeyId}
          onCopy={onCopy}
        />
      ))}
    </div>
  );
}
