import React from "react";
import { Lock, Settings } from "lucide-react";
import { TierBadge } from "./TierBadge";
import { SyncIndicator } from "./SyncIndicator";

interface HeaderProps {
  onLock: () => void;
  onSettings: () => void;
  tier: "free" | "pro";
  syncStatus: "synced" | "syncing" | "offline";
}

export function Header({ onLock, onSettings, tier, syncStatus }: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-lockbox-border">
      {/* Left: Logo + sync + tier */}
      <div className="flex items-center gap-2.5">
        {/* Lockbox logo */}
        <div className="w-7 h-7 rounded-lg bg-lockbox-accent/10 border border-lockbox-accent/20 flex items-center justify-center">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-lockbox-accent"
          >
            <rect
              x="3"
              y="11"
              width="18"
              height="11"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M7 11V7a5 5 0 0 1 10 0v4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="12" cy="16.5" r="1.5" fill="currentColor" />
          </svg>
        </div>

        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-lockbox-text leading-tight">
            Lockbox
          </h1>
          <TierBadge tier={tier} />
          <SyncIndicator status={syncStatus} />
        </div>
      </div>

      {/* Right: Lock + Settings */}
      <div className="flex items-center gap-1">
        <button
          onClick={onLock}
          className="p-1.5 rounded-md text-lockbox-text-muted hover:text-lockbox-text hover:bg-lockbox-surface transition-colors"
          title="Lock wallet"
          aria-label="Lock wallet"
        >
          <Lock className="w-4 h-4" />
        </button>
        <button
          onClick={onSettings}
          className="p-1.5 rounded-md text-lockbox-text-muted hover:text-lockbox-text hover:bg-lockbox-surface transition-colors"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
