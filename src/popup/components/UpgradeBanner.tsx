import React from "react";
import { Sparkles, X } from "lucide-react";

interface UpgradeBannerProps {
  keyCount: number;
  maxKeys: number;
  onUpgrade: () => void;
  onDismiss: () => void;
}

export function UpgradeBanner({
  keyCount,
  maxKeys,
  onUpgrade,
  onDismiss,
}: UpgradeBannerProps) {
  const usagePercent = Math.min((keyCount / maxKeys) * 100, 100);

  return (
    <div className="mx-3 mb-2 relative overflow-hidden rounded-lg border border-lockbox-pro/30 bg-gradient-to-r from-lockbox-pro/5 to-lockbox-pro/10 animate-fade-in">
      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-0.5 rounded text-lockbox-text-muted hover:text-lockbox-text transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="px-3 py-2.5 pr-7">
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-lockbox-pro" />
          <span className="text-xs font-semibold text-lockbox-text">
            Upgrade to Pro
          </span>
          <span className="text-[10px] text-lockbox-text-muted">
            &mdash; Unlimited keys
          </span>
        </div>

        {/* Usage bar */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 bg-lockbox-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${usagePercent}%`,
                backgroundColor:
                  usagePercent >= 90
                    ? "#ef4444"
                    : usagePercent >= 70
                      ? "#f59e0b"
                      : "#00d87a",
              }}
            />
          </div>
          <span className="text-[10px] text-lockbox-text-muted font-medium shrink-0">
            {keyCount}/{maxKeys}
          </span>
        </div>

        <button
          onClick={onUpgrade}
          className="w-full py-1.5 text-[11px] font-semibold rounded-md text-lockbox-bg transition-colors"
          style={{
            background: "linear-gradient(135deg, #FFD700, #FFA500)",
          }}
        >
          Upgrade Now
        </button>
      </div>
    </div>
  );
}
